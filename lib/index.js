"use strict";

const request = require('request');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const ProgressBar = require('progress');

class DownLoadFile{
    constructor(options){
        var _opt = options || {};

        this.waitList = new Map();//等待下载列表
        this.downList = new Map();//执行下载列表
        this.limited = _opt.limited || 10;//限制多少个同时下载
        this.failList = []; //下载失败的列表

        this.onerror = _opt.onerror || new Function;//错误处理方法
        this.onend = _opt.onend || new Function;//全部下载完成
        this.onfinish = _opt.onfinish || new Function;//单个下载完成
        this.progressEnabled = _opt.progressEnabled || false;//是否打印进度条

        this.downNum = 0;//下载执行次数
        this.failNum = 0;//下载失败次数
    }

    //添加等待项
    addItem(uri,filename){
        if(!this.waitList.has(uri)){
            this.waitList.set(uri,filename);
        }

        this.checkDownList();
    }

    //移除等待项
    rmItem(uri){
        this.waitList.delete(uri);
    }

    //添加下载项
    addDownItem(uri,filename){
        if(!this.downList.has(uri)){
            this.downList.set(uri,filename);
        }
    }

    //移除下载项
    rmDownItem(uri){
        this.downList.delete(uri);
    }

    //获取map的最后一个值   如果是获取第一个值，当第一个未下载完成（即没有从downList删掉）就会出现重复下载第一个值的数据，因为最后一个都是下载完成后动态加入的，则没有这个限制
    getLastData(smap){
        var n,re;
        for(n of smap){
            re = n;
        }
        return re;
    }

    //从列表下载文件
    getFile(){
        var _self = this;
        var _furi,_fname,obj;

        //取出第一个值
        obj = _self.getLastData(_self.downList);
        _furi = obj[0];
        _fname = obj[1];

        _self.saveFile(_furi,_fname,()=>{
            _self.rmDownItem(_furi);

            _self.checkDownList();
        },(isFullDown,_uri)=>{
            _self.onfinish(_uri,isFullDown);
            _self.rmDownItem(_furi);

            _self.checkDownList();
        });
    }

    //检查下载列表
    checkDownList(){
        var _self = this;
        if(_self.waitList.size > 0 && _self.downList.size<_self.limited){
            let _furi,_fname,obj;

            //取出第一个值
            obj = _self.getLastData(_self.waitList);
            _furi = obj[0];
            _fname = obj[1];

            _self.addDownItem(_furi,_fname);
            _self.rmItem(_furi);

            //下载文件
            _self.getFile();
        }

        if(!_self.waitList.size && !_self.downList.size){
            _self.onend();
        }
    }


    //获取head信息
    getHead(uri,callback){
        request.head(uri,callback);
    }

    //保存文件
    saveFile(uri,filename,errCall,endCall){
        var pathObj = path.parse(filename),_self = this;

        if(!fs.existsSync(pathObj.dir)){
            mkdirp.sync(pathObj.dir);
        }

        //下载次数
        _self.downNum++;

        //console.log(uri);
        request.get(uri)
        .on('response',function(res){
            res.pipe(fs.createWriteStream(filename));

            //判读是否显示进度条
            if(_self.progressEnabled){
                var conLength = parseInt(res.headers['content-length'], 10);
                var bar = new ProgressBar(uri+ ' [:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 20,
                    total: conLength
                });

                res.on('data',function(chunk){
                    // len += chunk.length;
                    // console.log(len,'==',conLength);
                    //_chunk += chunk;
                    bar.tick(chunk.length);
                });
            }

            res.on('end',()=>{
                //fs.writeFileSync(filename,_chunk);
                //校验是否现在完整
                var fileSize = fs.statSync(filename)['size'];
                var isFullDown = conLength===fileSize;

                //如果没有下载完整则为下载失败
                if(!isFullDown){
                    _self.failList.push(uri);

                    _self.failNum++;//下载失败次数
                }

                endCall && endCall(isFullDown,uri);
            });
        })
        .on('error',(err)=>{
            _self.failNum++;//下载失败次数
            _self.failList.push(uri);//下载失败列表操作

            errCall && errCall(err);
        });


        /*
        this.getHead(uri,(err,res,body)=>{
            if(err){
                errCall && errCall(err);
            }else{
                var conLength = parseInt(res.headers['content-length'], 10);

                request(uri)
                .pipe(fs.createWriteStream(filename))
                .on('close',()=>{
                    //校验是否现在完整
                    var fileSize = fs.statSync(filename)['size'];
                    var isFullDown = conLength===fileSize;

                    endCall && endCall(isFullDown,uri);
                })
                .on('error',(err)=>{
                    errCall && errCall(err);
                });
            }
        });
        */
    }
}

module.exports = DownLoadFile;
