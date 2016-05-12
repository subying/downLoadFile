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
		
		request(uri)
		.pipe(fs.createWriteStream(filename))
		.on('close',endCall)
		.on('error',errCall);
	}
}

module.exports = DownLoadFile;