const { exists } = require('fs-extra');
var fs = require('fs-extra')

var imageArray = new Array();
var missingCounter = 0;
fs.readdir('yolo/images', function (err, files) {
    if (files!=undefined){
        if (files.length>0){
        imageArray = files
        console.log(imageArray.length)
        fs.readdir('yolo/labels', function (err, labels) {
            if (labels!=undefined){
                if (labels.length>0){
                    for(var j=0; j<labels.length; j++) {
                        labelName = labels[j].split(".")
                        if (checkImage(labelName[0])==false&&labelName[1]!='DS_Store'){
                            missingCounter++
                            //console.log(labelName)
                            //fs.unlinkSync('yolo/labels/'+labelName[0]+'.txt')
                        }
                        
                    }
                    console.log(missingCounter)
                    console.log(labels.length)  
                }
            }
        })
        }
    }
})

function checkImage(name){
    var exists = false
    for(var j=0; j<imageArray.length; j++) {
        if (imageArray[j]==name+'.jpg')exists=true
    }
    return exists;
}