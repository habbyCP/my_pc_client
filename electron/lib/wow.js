const {dialog, BrowserWindow} = require("electron");
const {basename} = require("path");
const {ERROR_CODE, OK_CODE, OK_WOW_PATH, NONE_WOW} = require("./error_code");
const {send_msg} = require("./notice"); 
const fs = require("fs");
const json_path = './file.json'
const {error, debug} = require("./log");

 