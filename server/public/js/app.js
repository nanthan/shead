var app = angular.module('myApp', ['ui.router', 'angularFileUpload'])
.config(function($stateProvider, $urlRouterProvider){
      
    
    $stateProvider
      .state('photo', {
          url: "/photo",
          templateUrl: "templates/upload_photo.html",
          controller: "ctrlPhoto"
      }) 
      .state('video', {
          url: "/video",
          templateUrl: "templates/upload_video.html",
          controller: "ctrlVideo"
      });
    // For any unmatched url, send to /route1
    $urlRouterProvider.otherwise("/photo");
         
});