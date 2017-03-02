var express = require('express');
var opn = require('opn');
var path = require('path');
var app = express();


app.use('/image',express.static(__dirname+'/image'));
app.use('/css', express.static(__dirname+'/css'));
app.use('/js', express.static(__dirname+'/js'));
app.use('/node_modules', express.static(__dirname+'/node_modules'));
app.get('/', function(req,res){
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(9000, 'localhost', function (err){ 
  if(err){
    return console.error(err);
  }
  console.log('listening at http://localhost:9000');
  opn('http://localhost:9000');
})