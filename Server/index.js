
var sys = require('sys');
var execFileSync = require('child_process').execFileSync;
var spawn = require('child_process').spawn;
var read = require('read');
var fs = require('fs');
var curfile = "";
var child;

var options = {
	prompt: 'enter pass: ',
	silent: true,
	replace: '*'
};

function puts(error, stdout, stderr) { sys.puts(stdout) }
function writeout(error, stdout, stderr) {
//	fs.writeFileSync("error.txt", error);
	fs.writeFileSync("stdout.txt", stdout);
	fs.writeFileSync("stderr.txt", stderr);
}

function git(params) {
	execFileSync("git", params.split(), {"cwd": "workspace/" + configObj.current_project});
}

function testlogin(user, pass) {
	var out = execFileSync("curl", ["-u", user + ":" + pass, "https://api.github.com"]);

	var obj = JSON.parse(out);
	if (obj.message)
		return true;
	return false;
}

function createproj(user, pass, name) {
	var out = execFileSync("curl", ["-i", "-u", user + ":" + pass, "-d", "\'{\"name\":\"" + name + "\"}\'", "-X", "POST", "https://api.github.com/user/repos"]);

	var obj = JSON.parse(out);
	return out;
}

function clone(url) {
	var out = execFileSync("git", ["clone", url], {"cwd": "workspace"}).toString();
	configObj.current_project = out.substr(out.lastIndexOf("/" + 1));
	return out;
}

function pull() {
	var out = execFileSync("git", ["pull"], {"cwd": "workspace/" + configObj.current_project});
	return out.toString();
}

function add(filename) {
	var out = execFileSync("git", ["add", filename], {"cwd": "workspace/" + configObj.current_project});
	return out.toString();
}

function commit(message) {
	var out = execFileSync("git", ["commit", "-m", '"' + message + '"'], {"cwd": "workspace/" + configObj.current_project});
	return out.toString();
}

function newfile(filename) {
	var out = execFileSync("touch", [filename], {"cwd": "workspace/" + configObj.current_project});
	setcurfile(filename);
	return out.toString();
}

function push () {
	var out = execFileSync("git", ["push", "origin", "master"], {"cwd": "workspace/" + configObj.current_project});
	return out.toString();
}

function compile() {
	//console.log("javac " + "workspace/" + configObj.current_project + "/p.java");
	//execFileSync("\'javac " + "workspace/" + configObj.current_project + "/p.java\'");
	var files = getProjectFiles();
	var flies = [];
	for (var i = 0; i < files.length; i++)
		if (files[i].substr(files[i].length - 5) == ".java")
			flies.push("workspace/" + configObj.current_project + "/" + files[i]);
	try {
		/*
		child = spawn("javac", flies);
		child.stdout.on('data', function (data) { ws.send(JSON.stringify({type: "Console", contents: data.toString()}))});
		child.stderr.on('data', function (data) { ws.send(JSON.stringify({type: "Console", contents: data.toString()}))});
		*/
		var ret = execFileSync("javac", flies, {stdio: ['pipe', 'pipe', 'pipe']}).toString();
		return ret;
	} catch (error) {
		return error.message;
	}
}

function run(prog, args) {
	prog = prog.replace(".java","");
	var str = execFileSync("java", ["-cp", "workspace/" + configObj.current_project, prog]).toString();
	return str;
}

function listproj(user) {

	execFileSync("curl https://api.github.com/users/" + user + "/repos", writeout);
	out = fs.readFileSync("stdout.txt", "utf8");
	var obj = JSON.parse(out);

	return obj;
}

function setcurfile(filename) {
	curfile = filename;
}



var WebSocketServer = require('ws').Server;
var fs = require('fs');
var configObj = {};
function configExists()
{
	var exists = true;
	try
	{
		fs.accessSync("server.conf");
	}
	catch(err)
	{
		exists = false;
	}
	return exists;
}

function createConfig()
{
	console.log("No server.conf file detected! Generating server.conf...");
	try
	{
		fs.writeFileSync("server.conf", "{\n\t\"port\": 8080,\n\t\"max_clients\": 8,\n\t\"projects\": [],\n\t\"current_project\": \"\",\n\t\"current_file\": \"\",\n\t\"current_directory\": \"\"\n}");
		console.log("Successfully generated server.conf!");
	}
	catch(err)
	{
		console.log("Failed to generate server.conf! Reason: " + err);
	}
}

function readConfig()
{
	try
	{
		configObj = JSON.parse(fs.readFileSync("server.conf"));
	}
	catch(err)
	{
		console.log("Failed to read server.conf! Reason: " + err);
	}
}

function writeConfig()
{
	try
	{
		fs.writeFileSync("server.conf", JSON.stringify(configObj, null, "\t"));
	}
	catch(err)
	{
		console.log("Failed to write server.conf! Reason: " + err);
	}
}

function createFile(fileName)
{
	if(!fs.existsSync("workspace/" + configObj.current_project + "/" + fileName))
	{
		fs.writeFileSync("workspace/" + configObj.current_project + "/" + fileName, "");
		configObj.current_file = fileName;	
	}	
	else
	{
		console.log("Failed to create a file with the name '" + fileName + "' within the current project because a file with that name already exists!");
		return false;
	}
	return true;
}

function updateFile(fileName, newText)
{
	if(fs.existsSync("workspace/" + configObj.current_project + "/" + fileName))
	{
		fs.writeFileSync("workspace/" + configObj.current_project + "/" + fileName, newText);	
	}
	else
	{
		console.log("Failed to write to the file " + fileName + "!"); 
		return false;
	}
	return true;
}

function createDirectory(dirName)
{
	if(!fs.existsSync("workspace/" + configObj.current_project + "/" + dirName))
	{
		fs.mkdirSync("workspace/" + configObj.current_project + "/" + dirName);
		configObj.current_directory = dirName;	
	}
	else
	{
		console.log("Failed to create a directory with the name '" + dirName + "' within the current project because a file with that name already exists!");
		return false;
	}
	return true;
}

function createProject(projectName)
{
	if(!fs.existsSync(projectName))
	{
		fs.mkdirSync(projectName);
		configObj.projects.push(projectName);
		writeConfig();
	}
	else
	{
		console.log("Failed to create a project with the name '" + projectName + "' since one already exists!");
		return false;
	}
	return true;
}

function getProjectFiles()
{
	var files = null;
	try
	{
		files = fs.readdirSync("workspace/" + configObj.current_project);
	}
	catch(err)
	{
		console.log("Failed to read files from the current project directory!");
	}
	return files;
}

function broadcastResponse(connectionList, responseString)
{
	connectionList.forEach(function(conn)
	{
		conn.connection.send(responseString);
	});
}

function runServer(portNumber)
{
	console.log("Running the IDE server on port " + portNumber + "...");
	var server = new WebSocketServer({port: portNumber});
	var connectionList = [];
	var connind = -1;
	server.on('connection', function connection(ws)
	{
		console.log('New connection attempted!');
		ws.on('message', function incoming(message)
		{
			console.log('received: %s', message);
			var response = {"type": "", "contents": null};
			try
			{
				var json_message = JSON.parse(message);
				var nickname = json_message.nickname;
				var contents = json_message.contents;
				var command = contents.split(' ')[0].toLowerCase();
				var spaceIndex = contents.indexOf(' ');
				var params = contents.substring(spaceIndex + 1);

				var found = false;
				connectionList.forEach(function(conn)
				{
					if(conn.connection == ws)
					{
						found = true;
						connind = connectionList.indexOf(conn);
					}
				});
				if(!found)
				{
					console.log("User not found");
				}

				switch(command)
				{
					case "connect":
						response.type = "Connection-Accept";
						connectionList.forEach(function(conn)
						{
							if(conn.nickname == nickname)
							{
								response.contents = {"Accepted": false, "Reason": "The nickname you selected is already in use on this server. Please enter a unique nickname and try again."};
								console.log("Rejected incoming connection for taken nickname.");
							}
						});
						if(response.contents == null)
						{
							connectionList.push({"connection":ws,"nickname":nickname,"user":null,"pass":null,"valid":false});
							response.contents = {"Accepted": true};
							console.log("Accepted incoming connection from user '"+ nickname  +"'.");
						}
						ws.send(JSON.stringify(response));
						break;
					case "git":
						git(params);
						break;
					case "setusername":
						connectionList[connind].user = params;
						break;
					case "setpassword":
						connectionList[connind].pass = params;
						break;
					case "testcredentials":
						var user, pass;
						var valid = false;
						user = connectionList[connind].user;
						pass = connectionList[connind].pass;
						valid = testlogin(user, pass);
						connectionList[connectionList.indexOf(conn)].valid = valid;
						response.type = "Valid-Credentials-Status";
						response.contents = {"Valid": valid};
						break;
					case "compile":
						response.type = "Compile-Running-Status";
						console.log("Received command to compile!");
						response.contents = {"output": compile()};
						ws.send(JSON.stringify(response));
						break;
					case "run":
						response.type = "Code-Running-Status";		
						console.log("Running code...");
						var str = run(configObj.current_file, "some args");
						console.log(str);
						response.contents = {"output": str};
						ws.send(JSON.stringify(response));
						break;
					case "message":
						response.type = "Message-Broadcast";
						response.contents = nickname + ": " + params;
						console.log("Received chat message from user '" + nickname + "': " + params);
						broadcastResponse(connectionList, JSON.stringify(response));
						break;
					case "newproject":
						response.type = "Project-Created-Status";
						if(!createProject("workspace/" + params))
						{
							response.contents = {"Created": false, "Reason": "Failed to create a new project with the name '" + params + "'! That project name is already taken."};
						}
						else
						{
							configObj.current_project = params;
							response.contents = {"Created": true};
						}
						ws.send(JSON.stringify(response));
						break;
					case "git_newproject":
						if (connectionList[connind].valid)
							createproj(connectionList[connind].user, connectionList[connind].pass, "workspace/" + configObj.current_project);
						break;
					case "newfile":
						response.type = "File-Created-Status";
						if(!createFile(params))
						{
							response.contents = {"Created": false, "Reason": "Failed to create a new file with the name '" + params + "'! That file already exists in the current project."};
						}
						else
						{
							response.contents = {"Created": true};
						}
						ws.send(JSON.stringify(response));
						break;
					case "git_add":
						if (connectionList[connind].valid)
							add(params);
						break;
					case "newdir":
						response.type = "Directory-Created-Status";
						if(!createFile(params))
						{
							response.contents = {"Created": false, "Reason": "Failed to create a new directory with the name '" + params + "'! That file already exists in the current project."};
						}
						else
						{
							response.contents = {"Created": true};
						}
						ws.send(JSON.stringify(response));
						break;
					case "openproject":
						response.type = "Project-Open-Response";
						configObj.current_project = params;
						var files = getProjectFiles();
						if(files != null)
							response.contents = {"Opened": true, "Files": files};
						else
							response.contents = {"Opened": false};
						ws.send(JSON.stringify(response));
						break;
					case "openfile":
						response.type = "File-Open-Response";
						break;
					case "git_clone":
						clone(params);
						//if (connectionList[connind].valid)
						//	clone(params);
						break;
					case "git_pull":
						pull(params);
						//if (connectionList[connind].valid)
						//	pull(params);
						break;
					case "updatefile":
						response.type = "File-Update-Response";
						fileToUpdate = params.split(' ')[0];
						var spaceIndex = params.indexOf(' ');
						newText = params.substring(spaceIndex + 1);
						updateFile(fileToUpdate, newText);					
						console.log("Received a command to update the file '" + fileToUpdate + "'");
						break;
					case "readfile":
						response.type = "Read-File";
						var split = params.split(' ');
						var str = fs.readFileSync("workspace/" + split[0] + "/" + split[1]).toString();
						response.contents = {"body": str, "proj": split[0], "file": split[1]};
						ws.send(JSON.stringify(response));
						break;
					case "git_add":
						add(params);
						break;
					case "git_commit":
						commit(params);
						//if (connectionList[connind].valid)
						//	commit(params);
						break;
					case "git_push":
						push(params);
						//if (connectionList[connind].valid)
						//	push();
						break;
					default:
						response.type = "Error";
						response.contents = "Unrecognized command '" + command  + "'!";
						break;
				}
			}
			catch(err)
			{
				response.type = "Error";
				response.contents = "The message received did not match the proper protocol!\n Message: " + message + "\nExact error: " + err;
				console.log(err);
			}
		});
		ws.on('close', function()
		{
			var found = false;
			connectionList.forEach(function(conn)
			{
				if(conn.connection == ws)
				{
					found = true;
					console.log("User '" + conn.nickname  + "' has disconnected!");
					connectionList.splice(connectionList.indexOf(conn), 1);
				}
			});
			if(!found)
			{
				console.log("An unknown client disconnected!");
			}
		});
	});
}

if(!configExists())
	createConfig();

readConfig();

runServer(configObj.port);
