const request = require('request');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

class DownLoadFile{
	constructor(){
	}

	//获取head信息
	getHead(uri,callback){
			request.head(uri,callback);
	}

	//保存文件
	saveFile(uri,filename,errCall,endCall){
			var pathObj = path.parse(filename);

			if(!fs.existsSync(pathObj.dir)){
					mkdirp.sync(pathObj.dir);
			}

			this.getHead(uri,(err,res,body)=>{
					var conLength = res.headers['content-length'];

					request(uri)
					.pipe(fs.createWriteStream(filename))
					.on('close',()=>{
							//校验是否现在完整
							var fileSize = fs.statSync(filename)['size'];
							var isFullDown = conLength===fileSize;

							endCall && endCall(isFullDown);
					})
					.on('error',(err)=>{
							errCall && errCall(err);
					});
			});
	}
}

module.exports = DownLoadFile;
