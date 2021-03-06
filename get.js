const request = require('request');
//const fs = require('fs');
var fs = require('fs-extra')
readline = require('readline');
var lineReader = require('line-reader');
const http = require('http');
const axios = require('axios')
const wget = require('wget-improved');
const path = require('path');
const { exec } = require("child_process");
const { execFile } = require('child_process');
const { spawn } = require('child_process');
var rimraf = require("rimraf");
//var tar = require('tar-stream')    
var tar = require('tar-fs')

var catCounter = 0;
var targz = require('tar.gz');

cat = 'n00017222';
var wordList = new Array();;
var bboxList = new Array();;
var bboxNum = 0;
var bboxCategories = new Array();
var loopCounter = 0;
var catNames = new Array();
var extractMonitor = new Array();
var classList = new Array();
var labelList = new Array();
var maxNum = 100;
var activeClass = 0;

var arguments = process.argv.slice(2);
maxNum = arguments[0]
var dodisplay = true
var display = setInterval(function(){ 
  if (dodisplay==true){
    console.clear()
    // alldone = true;
    // for (var i=0; i<classList.length; i++){
    //     if (classList[i].alldone==false)alldone=false
    //     console.log(classList[i].loc+' | '+classList[i].imageCounter+' requested, '+classList[i].outCalls +' open requests ' +classList[i].imageLoaded+' downloaded | '+classList[i].fileCounter+' bbox | '+classList[i].errors+' timeouts')
    // }
    // if(alldone&&classList.length>0){
    //   console.log('alldone!')
    //   buildIndexes()
    // } 
    if (classList.length>0){
      currentObject = classList[activeClass]
      if (currentObject.started==false)currentObject.start()
      else if (currentObject.alldone==true){
        //console.log('object '+activeClass+' completed')
        if (activeClass<classList.length-1)activeClass++
        else{
          console.log('all done')
          buildIndexes()
        }
      }else{
        classCount = activeClass+1
        console.log('downloading class '+classCount+' of '+classList.length )
        console.log(currentObject.loc+' | '+currentObject.imageCounter+' requested, '+currentObject.outCalls +' open requests ' +currentObject.imageLoaded+' downloaded | '+currentObject.fileCounter+' bbox | '+currentObject.errors+' timeouts | listLoaded: '+currentObject.listLoaded+' requested: '+currentObject.listLoaded)
      }
    }
    
  }
  
}, 100);

function buildIndexes(){
  // fs.mkdirSync('class/images', { recursive: true });
  // fs.mkdirSync('class/annotations', { recursive: true });
  clearInterval(display)
  console.log('build index')
  namestxt='';
  indextxt='';
  var exportList = new Array()
  for (var i=0; i<classList.length; i++){
    if (classList[i].imageLoaded>0){
      namestxt+=classList[i].id+'\n'
      var title = classList[i].name
      indextxt+=title+'\n'
      exportList.push({id:classList[i].id,name:classList[i].name,itemsLoaded:classList[i].imageLoaded})
    }   
  }
  
  var body__ = JSON.stringify(exportList);
  fs.writeFileSync('images/classList.json', body__);
  summary()

  // fs.writeFile('class/names.txt', namestxt, function (err) {
  //   if (err) return console.log(err);
  //   fs.writeFile('class/index.txt', indextxt, function (err) {
  //     if (err) return console.log(err);
  //     summary()
  //   });
  // });

}
function summary(){

  for (var i=0; i<classList.length; i++){
    console.log(i+' '+classList[i].name+' | '+classList[i].imageLoaded + ' images loaded')
  }
  //console.log(classList)
  //var body__ = JSON.stringify(classList);
  //fs.writeFileSync('images/classList.json', body__);
  //copyFiles()
  
}
function copyFiles(){
 
  for (var i=0; i<classList.length; i++){
    var folder = 'images/'+classList[i].id
    //console.log(folder+'/annotations')
    fs.readdir(folder+'/annotations/', function (err, files) {
      if (files!=undefined){
        if (files.length>0){
          for(j=0; j<files.length; j++) {
            var file = files[j]
            var folder = file.split("_")
            folder = folder[0]
            fs.move('images/'+folder+'/annotations/'+file, 'class/annotations/'+file, function (err) {
            });
          } 
        }
      }
    })
    fs.readdir(folder+'/images/', function (err, files) {
      if (files!=undefined){
        if (files.length>0){
          for(j=0; j<files.length; j++) {
            var file = files[j]
            var folder = file.split("_")
            folder = folder[0]
            fs.move('images/'+folder+'/images/'+file, 'class/images/'+file, function (err) {
            });
          } 
        }
      }
    })

  }
  //process.exit(1)
}
class bboxDownload {

  constructor(image_path,loc,id,url,name) {
    this.image_path = image_path;
    this.loc = loc;
    this.id = id;
    this.url = url;
    this.name = name;
    this.interval;
    this.fileCounter = 0;
    this.imageCounter = 0;
    this.imageLoaded = 0;
    this.outCalls = 0;
    this.downloadedImages = new Array();
    this.bboxList;
    this.downloadStarted = false;
    this.axios = require('axios');;
    this.classRequest = require('request');
    this.alldone=false
    this.started = false
    this.errors = 0;
    this.listLoaded = false
    this.listRequested = false
    console.log('name'+name)
  }
  start(){
    this.started = true
    this.interval = setInterval(this.checkIfDownloadExists, 500,this.loc,this);
    
  }
  checkIfDownloadExists(loc,parent){
    fs.readdir(loc, function (err, files) {
      if (files!=undefined){
        if (files.length>0){
          if (files[0]=='bbox.tar.gz'){
            clearInterval(parent.interval);
            parent.extractTar(parent)
          }
        }
      }
    }) 
  }
  extractTar(parent){
    //console.log('extract '+ this.image_path)
    var extract = new targz().extract(this.image_path , this.loc, function(err){
      if(err)console.log(err);
      else{
        //console.log('extracted')
        //console.log(parent)
        parent.checkFolderInterval = setInterval(parent.checkFolder, 100,parent.loc,parent);
      }
    })
  }
  checkFolder(loc,parent){
    //console.log('check folder '+ loc)
    fs.readdir(loc+'/Annotation', function (err, files) {
      if (files!=undefined){
        if (files.length>0){
          //console.log('folder exists '+files[0])
          clearInterval(parent.checkFolderInterval);
          parent.checkFileInterval = setInterval(parent.checkFileCount, 100,parent.loc,parent,files[0]);
        }
      }
    })
  }
  checkFileCount(loc,parent,id){
    
    fs.readdir(loc+'/Annotation/'+id, function (err, files) {
      
      if (files!=undefined){   
        if (files.length>0){
          if(files.length==parent.fileCounter){
            parent.bboxList = files
            //console.log(loc+' : '+files.length+'bbox files')
            clearInterval(parent.checkFileInterval);
            fs.move(loc+'/Annotation/'+id, loc+'/annotations/', function (err) {
              rimraf(loc+'/Annotation/', function () { 
                
                fs.unlinkSync(parent.image_path)
                
                parent.imageURL(parent.id,parent.name,parent.url,parent.loc,files,parent);
                
                
              });
            })
          }
          parent.fileCounter = files.length;
        }
      }
    })
  }

  
  imageURL(cat,bboxName,url, target,files,parent){
    //console.log('waiting for file list')
    parent.listRequested = true
    request('http://www.image-net.org/api/text/imagenet.synset.geturls.getmapping?wnid='+cat, { json: false }, (err, res, body) => {
      var numberOfRequests = 0;
      if (err) { return console.log(err); }
        result = body.split(/\r?\n/);
        parent.listLoaded = true
        for (var i=0; i<result.length; i++){
          var line = result[i].split(' ');
          var name = line[0];
          var exists = false;
          for (var j=0; j<files.length; j++){
            var bbox = files[j].split('.')
            if (bbox[0]==name){
              //console.log(name)
              exists = true
              
            }
          }
          var dlUrl = line[1];
          if (dlUrl!=undefined&&exists==true){
            //console.log(dlUrl)
            this.downloadStarted = true;
            numberOfRequests++
            parent.downloadImg(dlUrl,target+'/images/'+name+'.jpg',parent);
          }
        }
        if (numberOfRequests==0){
          rimraf(parent.loc, function () { 
            //console.log('remove '+parent.loc) 
            parent.alldone = true
          });

        }
    })
  }
  downloadImg(url,image_path,parent){
    parent.imageCounter++;
    parent.outCalls++
    
    parent.download(url, image_path, parent, () => {
      
      //parent.outCalls--

    })
  }
  download = (url, path, parent, callback) => {
    //console.log(url)
    //url = 'http://farm1.static.flickr.com/25/63599030_3cf3903627.jpg'
    //request.head(url,(err, res, body) => {
      var r = request(url,{timeout: 60000})
        r.on('response', function (res) {
          //console.log(res.statusCode);
          if (res.statusCode === 200) {
            r.pipe(fs.createWriteStream(path))
            parent.imageLoaded++
            parent.outCalls--
            var name = path.split(".")
            name = name[0].split("/")
            parent.downloadedImages.push(name[3])
          }else{
            parent.outCalls--
          }
          if (parent.outCalls==0){
            //console.log('done')
            parent.removeBbox(path)
          }
        })
        r.on('error', function (res) {
          parent.outCalls--
          parent.errors++
          //console.log(res)
          if (parent.outCalls==0){
            //console.log('done')
            
            parent.removeBbox(path)
          }
        })
        
    //})
  }
  
  removeBbox(image_path){
    var path = image_path.split("/")
    path = path[0]+'/'+path[1]+'/annotations/'
    //console.log(this.downloadedImages)
    for (var i=0; i<this.bboxList.length;i++){
      var name = this.bboxList[i].split('.')
      name = name[0]
      var imageExists = false
      for (var j=0; j<this.downloadedImages.length;j++){
        var imageName = this.downloadedImages[j]
        if(imageName==name)imageExists = true
      }
      if (imageExists==false){
        fs.unlinkSync(path+name+'.xml')
        //console.log(path+name+'.xml')
      }
    }
    this.alldone=true
    //console.log(this.loc+' / '+this.downloadedImages.length+' objects')   
  }
}

const download_image = (url, image_path,zip,loc,id, name,realName) =>
    axios({
      url,
      responseType: 'stream',
    }).then(
      response =>
        new Promise((resolve, reject) => {
          //console.log(url+' / '+id)
          if (zip==true){ 
            b = new bboxDownload(image_path,loc,id,url,realName);
            classList.push(b)
          }
          response.data
            .pipe(fs.createWriteStream(image_path))
            .on('finish', () => resolve())
            .on('finish', function(){
              //console.log('done')
            })

        }),
);


start();

       
function start(){
  lineReader.eachLine('data/worldlist.txt', function(line, last) {
    
    data = line.split('\t');
    wordList.push({'name':data[1],'id':data[0]})

    if(last){
        console.log('wordlist loaded')
        getBboxList()
        
    }
  });
}


function getBboxList(){
  lineReader.eachLine('data/bbox.txt', function(line, last) {

    data = line.split('">');
    url = data[0].substring(9)
    if(data[1]!=undefined){
      name = data[1].split('<');
      name = name[0]
      //console.log(name)
      bboxList.push({'name':name,'url':url})
    }
    
    
    

    if(last){
        //console.log('xList')
        console.log('bboxlist loaded')
        getClasses(cat,0)
    }
  });
}


function getClasses(cat,level){
    //console.log(cat)
    loopCounter++
   
    //console.log('http://www.image-net.org/api/text/wordnet.structure.hyponym?wnid='+cat)
    request('http://www.image-net.org/api/text/wordnet.structure.hyponym?wnid='+cat, { json: false }, (err, res, body) => {
        if (err) { return console.log(err); }
        result = body.split(/\r?\n/)
        var endpoint = false
        if (result.length==2)endpoint=true
        
        for(var i=0; i<result.length; i++){
            id = result[i].substring(1);
            
            for(var j=0; j<wordList.length; j++){
              if (wordList[j].id==id){
                name = wordList[j].name

                //if(name=='costume')console.log(wordList[j].name+' / '+id)
                for(var k=0; k<bboxList.length; k++){
                  bboxName = bboxList[k].name
                  url = bboxList[k].url
                  
                  if (bboxName==name){
                    //item exists as bbox
                    //console.log(endpoint)
                    dir = 'images/'+id
                    
                    if (catCounter<maxNum&&!catExists(name)){

                      if (endpoint==true){
                        console.log('endpoint '+name)
                      }
                      fs.mkdirSync(dir, { recursive: true });
                      fs.mkdirSync(dir+'/images', { recursive: true });
                      
                      console.log(catCounter+' '+name+' '+result.length)

                      downloadXML(url,dir,id,name)
                      catNames.push(name)
                      catCounter++
                    }
                    bboxNum++
                  }
                }              
                getClasses(id,level+1);
              }
            }           
        }
        loopCounter--
      });     
}
function catExists(n){
  e = false;
  for(var i=0; i<catNames.length; i++){
    if (n==catNames[i])e=true;
  }
  return e;
}
//downloadXML()
function downloadXML(url,target,id,name){
  url = url.substring(5)
 
  request('http://www.image-net.org/'+url, {followAllRedirects:true},function (error, response, body) {

    body = body.split('url=');
    body = body[1]
    body = body.split('"')
    body = body[0]
    
    download_image('http://www.image-net.org/'+body, target+'/bbox.tar.gz',true,target,id,url,name)
  });
}
function getImageUrls(cat,bboxName,url, target,files){
  counter = 0;   
  request('http://www.image-net.org/api/text/imagenet.synset.geturls.getmapping?wnid='+cat, { json: false }, (err, res, body) => {
    if (err) { return console.log(err); }
    result = body.split(/\r?\n/);
    bboxCategories.push({name:bboxName, url:url, cat:cat, images:result})
      for (var i=0; i<result.length; i++){
        line = result[i].split(' ');
        name = line[0];
        exists = false;
        for (var j=0; j<files.length; j++){
          bbox = files[j].split('.')
          if (bbox[0]==name){
            console.log(name)
            exists = true
            counter++
          }
        }

        url = line[1];
        if (url!=undefined&&exists==true){
          //console.log(url)
          download_image(url,target+'/images/'+name+'.jpg');
        } 
        if (i==result.length-1)console.log('done')
      }
      return counter;
  })
}