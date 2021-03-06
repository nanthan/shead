//inject angular file upload directives and services.
angular.module('myApp')

.controller('ctrlPhoto', function($scope, $http, $rootScope, $upload, $timeout, $interval){
	// Check that the browser supports the FileReader API.
	if (!window.FileReader) {
		document.write('<strong>Sorry, your web browser does not support the FileReader API.</strong>');
		return;
	}

		var dropZone = document.getElementById('drop-zone');
	    var uploadForm = document.getElementById('js-upload-form');
	    var files;
	    var exif_data;
	    var listOfEXIF = [];
	    var JSONObjFinal;
	    var listOfJSONFinal = [];
	    var centerOfList = [];
	    var idList = [];
	    var listOfGPSEachFile = [];
	    var listOfGPSNearEachFile = [];
	    var checkTotalHaveToClose = true;
	    var maxDistance = 50;
	    var tempArrayImg = [];
	    var fileList = [];
		var nameList = [];
		var indexToRemove = [];
		var validatedFiles = [];

		$scope.totalFiles = 0;
	    $scope.listImgThumb = [];
	    $scope.percent = 0;
	    $scope.progress = 0;
	    $scope.isDisable = false;
	    $scope.processedCount= 0;


    

    document.getElementById("js-upload-files").onclick = function(e) {
    	listOfEXIF = [];
    	listOfJSONFinal = [];
    	centerOfList = [];
    	idList = [];
    	listOfGPSEachFile = [];
    	checkTotalHaveToClose = true;
    	$scope.processedCount= 0;
		$scope.totalFiles = 0;
    }

    document.getElementById("js-upload-files").onchange = function(e) {
        files = e.target.files;
        //console.log(files);
        if(files.length != 0){
        	for (var i = 0; i < files.length; i++) {
        		if(!checkValueInList(indexToRemove, i)){
        			handleFile(files[i], i);		
        		}
			}
			$timeout(function() {
				checkNearBy();
				console.log(e);
				showThumbnail(e);
			}, 1000);	

        }
        else{
        	listOfEXIF = [];
        }
        //myFileList(files);
    }

	function handleFile(file, i) {

	    var reader = new FileReader();  
	    var exif;
	    reader.onload = function(e) {  
	       try {
		        var text = e.target.result; 
		        exif = new ExifReader();
				exif.load(e.target.result);
				exif.deleteTag('MakerNote');
				exif_data = exif.getAllTags();
				listOfEXIF.push(exif_data);
			} catch (error) {
				alert(error);
			}
	    }
    	reader.readAsArrayBuffer(files[i].slice(0, 128 * 1024));	
	}
	


	showDataInTable = function(tags){
		var tableBody, name, row;
		tableBody = document.getElementById('exif-table-body');
		for (name in tags) {
			if (tags.hasOwnProperty(name)) {
				row = document.createElement('tr');
				row.innerHTML = '<td>' + name + '</td><td>' + tags[name].description + '</td>';
				tableBody.appendChild(row);
			}
		}
	}

    $scope.submitPhoto = function(){
    	$scope.isDisable = true;
    	//console.log(listOfEXIF);
    	for(var i = 0 ; i < listOfEXIF.length ; i++){
    		if(!checkValueInList(indexToRemove, i)){
    			listOfJSONFinal.push(findExif(listOfEXIF[i]));
    		}
    	}

		//console.log(listOfJSONFinal);

    	if(listOfJSONFinal != null && checkTotalHaveToClose && listOfEXIF.length != 0){
   			$http.post('http://shead.cloudapp.net:3000/api/ImageMetadatas', listOfJSONFinal)
			.success(function(data, status, headers, config) {
			    //console.log("Status : " + status + ", save metadata complete!");
			    for(var i = 0 ; i < data.length ; i++){
			    	console.log("Status : " + status + ", ID : "+data[i].id+", save metadata complete!");
			    	idList.push(data[i].id);
			    }
			    	uploadImg(idList); 
			})
			.error(function(data, status, headers, config) {
			    
			});
			
    	}
    	else{
    		console.log("No GPS data or not select file.");
    		$scope.isDisable = false;
    	}

	}
    
    dropZone.ondrop = function(e) {
        e.preventDefault();
        this.className = 'upload-drop-zone';
        //handleFile(e.dataTransfer.files);
        files = e.dataTransfer.files;
        //console.log(files);
        if(files.length != 0){
	        for (var i = 0; i < files.length; i++) {
			    handleFile(files[i], i);
			}
			$timeout(function() {
					checkNearBy();
			}, 10);	
			showThumbnail(e);
		}
		else{
        	listOfEXIF = [];
        }
    }

    dropZone.ondragover = function() {
        this.className = 'upload-drop-zone drop';
        return false;
    }

    dropZone.ondragleave = function() {
        this.className = 'upload-drop-zone';
        return false;
    }

    $scope.go = function(path) {
  		$location.path(path);
	};

	
	uploadImg = function(idList) {
		for(var i = 0 ; i < files.length ; i++){
			if(!checkValueInList(indexToRemove, i)){
				fileList.push(files[i]);
			}
			nameList.push(idList[i] + (files[i].type === "image/jpeg" ? ".jpg" : ""));
		}

		$scope.upload = $upload
		.upload({
		    url: 'http://shead.cloudapp.net:3000/api/containers/images/upload', //upload.php script, node.js route, or servlet url 
		    method: 'POST', 
		    //headers: {'header-key': 'header-value'}, 
		    //withCredentials: true, 
		    //data: {myObj: "test11111111"},
		    file: fileList, // or list of files ($files) for html5 only 
		    //fileName: id + (file.type === "image/jpeg" ? ".jpg" : "")
		    fileName: nameList,
		    // customize file formData name ('Content-Desposition'), server side file variable name.  
		    //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file'  
		    // customize how data is added to formData. See #40#issuecomment-28612000 for sample code 
		    //formDataAppender: function(formData, key, val){} 
		  }).progress(function(evt) {
		    //console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));
		    $scope.percent = parseInt(100.0 * evt.loaded / evt.total);
		    //console.log($scope.percent);
		    //console.log(evt);
		  }).success(function(data, status, headers, config) {
		    // file is uploaded successfully
		    for(var i = 0 ; i < data.result.files.file.length ; i++){
		    	console.log("Status : " + status + ", upload " + data.result.files.file[i].name + " complete!");	
		    }
		    
		    listOfEXIF = [];
		    listOfJSONFinal = [];
		    fileList = [];
			nameList = [];
			$scope.isDisable = false;
		    //console.log(data);
		  });

    }


  	checkNearBy = function(){
  		var checkTotalHaveGPS;

  		for(var i = 0 ; i < listOfEXIF.length ; i++){
  			if(listOfEXIF[i].GPSLatitude != undefined && listOfEXIF[i].GPSLongitude != undefined){
  				listOfGPSEachFile.push([listOfEXIF[i].GPSLatitude.description, listOfEXIF[i].GPSLongitude.description]);	
  			}
  			else{
  				console.log("File " + files[i].name + " have not GPS.");
  				listOfGPSEachFile.push(null); //push null to list if file[i] have not GPS.
  			}
  		}

  		//check list have null?
  		if(checkValueInList(listOfGPSEachFile, null)){
  			//console.log("have null");
  			checkTotalHaveGPS = false;
  			checkTotalHaveToClose = false;
  		}
  		else{
  			checkTotalHaveGPS = true;
  		}

  		//if(checkTotalHaveGPS){
  		if(true){

			//get GPS point first file
			for(var i = 0 ; i < listOfGPSEachFile.length ; i++){
				if(listOfGPSEachFile[i] != null){
					centerOfList = listOfGPSEachFile[i];
					break;
				}
			}
			
	  		for(var i = 0 ; i < listOfEXIF.length ; i++){
		  		if(listOfEXIF[i].GPSLatitude != undefined && listOfEXIF[i].GPSLongitude != undefined){
		  			if(calculateDistance(centerOfList[0],centerOfList[1],listOfEXIF[i].GPSLatitude.description,listOfEXIF[i].GPSLongitude.description) > maxDistance){
		  				checkTotalHaveToClose = false; //some file so far than maxDistance
		  				listOfGPSNearEachFile.push(true); //true mean far
		  				//break;
		  			}
		  			else{
		  				listOfGPSNearEachFile.push(false);
		  				checkTotalHaveToClose = true; //all file have gps and close together
		  			}
		  		}
		  		else{
		  			checkTotalHaveToClose = false; //some file not have GPS
		  			listOfGPSNearEachFile.push(null);
		  			//break;
		  		}
	  		}
	  		if(checkTotalHaveToClose){
	  			console.log("Can be uploaded");
	  		}
	  		else{
	  			console.log("GPS point not close");
	  		}
  		}
  		
  	}

  	function calculateDistance(lat1, lon1, lat2, lon2) {
		var R = 6371000; // metres
		var dLat = (lat2 - lat1).toRad();
		var dLon = (lon2 - lon1).toRad(); 
		var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * 
			Math.sin(dLon / 2) * Math.sin(dLon / 2); 
		var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
		var d = R * c;
		return d;
	}
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	}

	$scope.cancelUpload = function(){
		$scope.upload.abort();
		console.log("canceled.");
		$timeout(function() {
			$scope.percent = 0;
		}, 10);
		idList = [];
		listOfEXIF = [];
    	listOfJSONFinal = [];
    	centerOfList = [];
    	listOfGPSEachFile = [];
    	files = null;
    	$scope.isDisable = false;
	}


    
    showThumbnail = function(evt){
    	var files = (evt.dataTransfer || evt.target).files; // FileList object

		$scope.totalFiles = files.length; // important
	
		// files is a FileList of File objects. List some properties.
		var i = 0;
		$interval(function(){
			f = files[i]
			//Create new file reader
			var r = new FileReader();
			//On load call
			r.onload = (function(theFile){
			    return function(){
			      onLoadHandler(this, i);
			      onLoadEndHandler(this, i);
			   };
			})(f);
			r.readAsDataURL(f);
			i++;	
		}, 500, files.length);

    }
 
 	function onLoadEndHandler(fileReader, index){

		$scope.processedCount++;

	  	
		if($scope.processedCount == $scope.totalFiles){ 
			$timeout(function() {
				//do_somethings
			}, 10);
		}

	  $timeout(function() {
	  	$scope.progress = $scope.processedCount/files.length;
	  }, 10);
	}

	function onLoadHandler(fileReader, index){
		
		if(listOfGPSEachFile[$scope.processedCount] != null){ //have gps
			if(listOfGPSNearEachFile[$scope.processedCount] == false ){
				$scope.listImgThumb.push([fileReader.result, false, false]); //close
			}
			else{
				$scope.listImgThumb.push([fileReader.result, false, true]);	//far
			}
		}
		else{
			$scope.listImgThumb.push([fileReader.result, true, null]);	//have not gps
		}	
		
	}

	$scope.clearImg = function(){
		$scope.listImgThumb = [];
		$scope.progress = 0;
		$scope.processedCount= 0;
		$scope.totalFiles = 0;
		listOfGPSEachFile = [];
		centerOfList = [];
	}

	$scope.removeImg = function(index){
		//console.log(index);	
		if (index > -1) {
		    $scope.listImgThumb.splice(index, 1);
		    //listOfEXIF.splice(index, 1);
		    indexToRemove.push(index);
		    //console.log(files);
		    checkNearBy();
		    //files.splice(index, 1);
		    //fileList.splice(index, 1);
		    //nameList.splice(index, 1);
		    
		    //listOfGPSEachFile = [];
			//listOfGPSNearEachFile = [];
		    //checkNearBy();
		}
		//console.log($scope.listImgThumb);
	}

	function checkValueInList(list, value){
		return!!~list.indexOf(value)
	}

	function myFileList(e){
		console.log(e);

		var files = e;
		for(var i = 0 ; i < e.length ; i++){
			validatedFiles.push(e[i]);
		}
		console.log(validatedFiles);
	}
});