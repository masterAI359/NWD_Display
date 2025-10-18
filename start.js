/////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////

//-------------------------------------------------------------------
// These packages are included in package.json.
// Run `npm install` to install them.
// 'path' is part of Node.js and thus not inside package.json.
//-------------------------------------------------------------------
// Load environment variables from .env file if it exists
require('dotenv').config();

var express = require('express');           // For web server
var Axios = require('axios');               // A Promised base http client
var bodyParser = require('body-parser');    // Receive JSON format

// Configure axios defaults for large file uploads
Axios.defaults.maxContentLength = Infinity;
Axios.defaults.maxBodyLength = Infinity;

// Set up Express web server
var app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + '/www'));

// This is for web server to start listening to port 3000
app.set('port', 3000);
var server = app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + server.address().port);
});

//-------------------------------------------------------------------
// Configuration for your Forge account
// Initialize the 2-legged OAuth2 client, and
// set specific scopes
//-------------------------------------------------------------------
var FORGE_CLIENT_ID = process.env.FORGE_CLIENT_ID;
var FORGE_CLIENT_SECRET = process.env.FORGE_CLIENT_SECRET;
var access_token = '';
var scopes = 'data:read data:write data:create bucket:create bucket:read';
const querystring = require('querystring');

// Validate required environment variables
if (!FORGE_CLIENT_ID || !FORGE_CLIENT_SECRET) {
    console.error('❌ Error: Missing required environment variables!');
    console.error('Please set the following environment variables:');
    console.error('  FORGE_CLIENT_ID=your_client_id_here');
    console.error('  FORGE_CLIENT_SECRET=your_client_secret_here');
    console.error('');
    console.error('For Windows:');
    console.error('  set FORGE_CLIENT_ID=your_client_id_here');
    console.error('  set FORGE_CLIENT_SECRET=your_client_secret_here');
    console.error('');
    console.error('For Mac/Linux:');
    console.error('  export FORGE_CLIENT_ID=your_client_id_here');
    console.error('  export FORGE_CLIENT_SECRET=your_client_secret_here');
    console.error('');
    console.error('Or create a .env file with these variables and install dotenv package.');
    process.exit(1);
}

// // Route /api/forge/oauth
app.get('/api/forge/oauth', function (req, res) {
    Axios({
        method: 'POST',
        url: 'https://developer.api.autodesk.com/authentication/v2/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        data: querystring.stringify({
            client_id: FORGE_CLIENT_ID,
            client_secret: FORGE_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: scopes
        })
    })
        .then(function (response) {
            // Success
            access_token = response.data.access_token;
            console.log('Authentication successful:', response.data);
            res.redirect('/api/forge/datamanagement/bucket/create');
        })
        .catch(function (error) {
            // Failed
            console.log(error);
            res.send('Failed to authenticate');
        });
});

// Route /api/forge/oauth/public
app.get('/api/forge/oauth/public', function (req, res) {
    // Limit public token to Viewer read only
    Axios({
        method: 'POST',
        url: 'https://developer.api.autodesk.com/authentication/v2/token',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
        },
        data: querystring.stringify({
            client_id: FORGE_CLIENT_ID,
            client_secret: FORGE_CLIENT_SECRET,
            grant_type: 'client_credentials',
            scope: 'viewables:read'
        })
    })
        .then(function (response) {
            // Success
            console.log('Public authentication successful:', response.data);
            res.json({ access_token: response.data.access_token, expires_in: response.data.expires_in });
        })
        .catch(function (error) {
            // Failed
            console.log(error);
            res.status(500).json(error);
        });
});

// Buckey key and Policy Key for OSS
const bucketKey = FORGE_CLIENT_ID.toLowerCase() + '_tutorial_bucket'; // Prefix with your ID so the bucket key is unique across all buckets on all other accounts
const policyKey = 'transient'; // Expires in 24hr

// Route /api/forge/datamanagement/bucket/create
app.get('/api/forge/datamanagement/bucket/create', function (req, res) {
    // Create an application shared bucket using access token from previous route
    // We will use this bucket for storing all files in this tutorial
    Axios({
        method: 'POST',
        url: 'https://developer.api.autodesk.com/oss/v2/buckets',
        headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + access_token
        },
        data: JSON.stringify({
            'bucketKey': bucketKey,
            'policyKey': policyKey
        })
    })
        .then(function (response) {
            // Success
            console.log(response);
            res.redirect('/api/forge/datamanagement/bucket/detail');
        })
        .catch(function (error) {
            if (error.response && error.response.status == 409) {
                console.log('Bucket already exists, skip creation.');
                res.redirect('/api/forge/datamanagement/bucket/detail');
                return;
            }
            // Failed
            console.log(error);
            res.send('Failed to create a new bucket');
        });
});

// Route /api/forge/datamanagement/bucket/detail
app.get('/api/forge/datamanagement/bucket/detail', function (req, res) {
    Axios({
        method: 'GET',
        url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/details',
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })
        .then(function (response) {
            // Success
            console.log(response);
            res.redirect('/upload.html');
        })
        .catch(function (error) {
            // Failed
            console.log(error);
            res.send('Failed to verify the new bucket');
        });
});

// For converting the source into a Base64-Encoded string
var Buffer = require('buffer').Buffer;
String.prototype.toBase64 = function () {
    // Buffer is part of Node.js to enable interaction with octet streams in TCP streams, 
    // file system operations, and other contexts.
    return new Buffer(this).toString('base64');
};

var multer = require('multer');         // To handle file upload
var upload = multer({ 
    dest: 'tmp/',
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
}); // Save file into local /tmp folder

// Route /api/forge/datamanagement/bucket/upload
app.post('/api/forge/datamanagement/bucket/upload', upload.single('fileToUpload'), function (req, res) {
    // Check if file was uploaded
    if (!req.file) {
        return res.status(400).send('No file uploaded or file too large (max 100MB)');
    }
    
    var fs = require('fs'); // Node.js File system for reading files
    var path = require('path');
    
    fs.readFile(req.file.path, function (err, filecontent) {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Error reading uploaded file');
        }
        
        var fileName = req.file.originalname;
        var fileSize = filecontent.length;
        
        // For files larger than 5MB, use multipart upload
        if (fileSize > 5 * 1024 * 1024) {
            console.log('File size:', fileSize, 'bytes - using multipart upload');
            
            // Calculate number of parts (minimum 5MB per part)
            var partSize = 10 * 1024 * 1024; // 10MB per part
            var numParts = Math.ceil(fileSize / partSize);
            
            // Step 1: Get signed URLs for multipart upload
            Axios({
                method: 'GET',
                url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/objects/' + encodeURIComponent(fileName) + '/signeds3upload?parts=' + numParts,
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    'Content-Type': 'application/json'
                }
            })
            .then(function (signedUrlResponse) {
                console.log('Got signed URLs for multipart upload');
                var uploadKey = signedUrlResponse.data.uploadKey;
                var urls = signedUrlResponse.data.urls;
                
                // Step 2: Upload parts to S3
                var uploadPromises = [];
                for (var i = 0; i < numParts; i++) {
                    var start = i * partSize;
                    var end = Math.min(start + partSize, fileSize);
                    var partData = filecontent.slice(start, end);
                    
                    uploadPromises.push(
                        Axios({
                            method: 'PUT',
                            url: urls[i],
                            headers: {
                                'Content-Type': 'application/octet-stream',
                                'Content-Length': partData.length
                            },
                            data: partData,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity
                        })
                    );
                }
                
                return Promise.all(uploadPromises).then(function() {
                    console.log('All parts uploaded successfully');
                    return uploadKey;
                });
            })
            .then(function (uploadKey) {
                // Step 3: Complete the multipart upload
                return Axios({
                    method: 'POST',
                    url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/objects/' + encodeURIComponent(fileName) + '/signeds3upload',
                    headers: {
                        'Authorization': 'Bearer ' + access_token,
                        'Content-Type': 'application/json',
                        'x-ads-meta-Content-Type': 'application/octet-stream'
                    },
                    data: JSON.stringify({
                        'uploadKey': uploadKey
                    })
                });
            })
            .then(function (response) {
                // Success
                console.log('Multipart upload successful:', response.data);
                var urn = response.data.objectId.toBase64();
                
                // Clean up temporary file
                fs.unlink(req.file.path, function(err) {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                res.redirect('/api/forge/modelderivative/' + urn);
            })
            .catch(function (error) {
                // Failed
                console.error('Multipart upload failed:', error.response ? error.response.data : error.message);
                
                // Clean up temporary file
                fs.unlink(req.file.path, function(err) {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                res.status(500).send('Failed to upload file: ' + (error.response ? error.response.data.developerMessage || error.response.statusText : error.message));
            });
        } else {
            // For smaller files, use direct upload (if still supported)
            console.log('File size:', fileSize, 'bytes - using direct upload');
            
            Axios({
                method: 'PUT',
                url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/objects/' + encodeURIComponent(fileName),
                headers: {
                    Authorization: 'Bearer ' + access_token,
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename*=UTF-8\'\'' + encodeURIComponent(fileName),
                    'Content-Length': fileSize
                },
                data: filecontent,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            })
            .then(function (response) {
                // Success
                console.log('Direct upload successful:', response.data);
                var urn = response.data.objectId.toBase64();
                
                // Clean up temporary file
                fs.unlink(req.file.path, function(err) {
                    if (err) console.error('Error deleting temp file:', err);
                });
                
                res.redirect('/api/forge/modelderivative/' + urn);
            })
            .catch(function (error) {
                // If direct upload fails, try multipart upload as fallback
                console.log('Direct upload failed, trying multipart upload as fallback');
                
                var partSize = 10 * 1024 * 1024;
                var numParts = Math.ceil(fileSize / partSize);
                
                Axios({
                    method: 'GET',
                    url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/objects/' + encodeURIComponent(fileName) + '/signeds3upload?parts=' + numParts,
                    headers: {
                        'Authorization': 'Bearer ' + access_token,
                        'Content-Type': 'application/json'
                    }
                })
                .then(function (signedUrlResponse) {
                    var uploadKey = signedUrlResponse.data.uploadKey;
                    var urls = signedUrlResponse.data.urls;
                    
                    var uploadPromises = [];
                    for (var i = 0; i < numParts; i++) {
                        var start = i * partSize;
                        var end = Math.min(start + partSize, fileSize);
                        var partData = filecontent.slice(start, end);
                        
                        uploadPromises.push(
                            Axios({
                                method: 'PUT',
                                url: urls[i],
                                headers: {
                                    'Content-Type': 'application/octet-stream',
                                    'Content-Length': partData.length
                                },
                                data: partData,
                                maxContentLength: Infinity,
                                maxBodyLength: Infinity
                            })
                        );
                    }
                    
                    return Promise.all(uploadPromises).then(function() {
                        return uploadKey;
                    });
                })
                .then(function (uploadKey) {
                    return Axios({
                        method: 'POST',
                        url: 'https://developer.api.autodesk.com/oss/v2/buckets/' + encodeURIComponent(bucketKey) + '/objects/' + encodeURIComponent(fileName) + '/signeds3upload',
                        headers: {
                            'Authorization': 'Bearer ' + access_token,
                            'Content-Type': 'application/json',
                            'x-ads-meta-Content-Type': 'application/octet-stream'
                        },
                        data: JSON.stringify({
                            'uploadKey': uploadKey
                        })
                    });
                })
                .then(function (response) {
                    console.log('Fallback multipart upload successful:', response.data);
                    var urn = response.data.objectId.toBase64();
                    
                    // Clean up temporary file
                    fs.unlink(req.file.path, function(err) {
                        if (err) console.error('Error deleting temp file:', err);
                    });
                    
                    res.redirect('/api/forge/modelderivative/' + urn);
                })
                .catch(function (fallbackError) {
                    console.error('Fallback multipart upload failed:', fallbackError.response ? fallbackError.response.data : fallbackError.message);
                    
                    // Clean up temporary file
                    fs.unlink(req.file.path, function(err) {
                        if (err) console.error('Error deleting temp file:', err);
                    });
                    
                    res.status(500).send('Failed to upload file: ' + (fallbackError.response ? fallbackError.response.data.developerMessage || fallbackError.response.statusText : fallbackError.message));
                });
            });
        }
    });
});

// Route /api/forge/modelderivative
app.get('/api/forge/modelderivative/:urn', function (req, res) {
    var urn = req.params.urn;
    var format_type = 'svf';
    var format_views = ['2d', '3d'];
    
    // For NWD files, we need to specify the correct input format
    var jobData = {
        'input': {
            'urn': urn
        },
        'output': {
            'formats': [
                {
                    'type': format_type,
                    'views': format_views
                }
            ]
        }
    };
    
    Axios({
        method: 'POST',
        url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
        headers: {
            'content-type': 'application/json',
            Authorization: 'Bearer ' + access_token
        },
        data: JSON.stringify(jobData)
    })
        .then(function (response) {
            // Success - job started
            console.log('Model derivative job started:', response.data);
            res.redirect('/viewer.html?urn=' + urn);
        })
        .catch(function (error) {
            // Failed
            console.error('Model derivative job failed:', error.response ? error.response.data : error.message);
            res.status(500).send('Error starting Model Derivative job: ' + (error.response ? error.response.data.developerMessage || error.response.statusText : error.message));
        });
});

// Route to check model derivative job status
app.get('/api/forge/modelderivative/status/:urn', function (req, res) {
    var urn = req.params.urn;
    
    Axios({
        method: 'GET',
        url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/' + encodeURIComponent(urn) + '/manifest',
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    })
        .then(function (response) {
            // Success
            res.json(response.data);
        })
        .catch(function (error) {
            // Failed
            console.error('Failed to get manifest:', error.response ? error.response.data : error.message);
            res.status(500).json({ 
                error: 'Failed to get manifest: ' + (error.response ? error.response.data.developerMessage || error.response.statusText : error.message)
            });
        });
});
