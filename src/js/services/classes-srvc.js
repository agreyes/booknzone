angular.module('FFApp')
    .service('ClassesService', ['$http', 'moment', '$uibModal', ClassesService]);

    function ClassesService($http, moment, $uibModal){
        this.getClasses = function(desired_date, refresh){
            return $http.get("/classes/get/" + (desired_date || ""), {cache: !refresh}).
                then(function(response) {
                    return response.data;
                }, function(response) {
                    return response;
                });
        };

        this.getSchedule = function(desired_date, refresh){
            return $http.get("/classes/schedule/" + (desired_date || ""), {cache: !refresh}).
                then(function(response) {
                    return response.data;
                }, function(response) {
                    return response;
                });
        };

        this.registerForClass = function(desired_date
            , class_id
            , spots
            , paymentMethod){
            return $http.post("/class/" 
                + desired_date + "/"
                + class_id + "/"
                + spots + "/"
                + paymentMethod).
                then(function(response) {
                    return response.data;
                }, function(response) {
                    return response;
                });
        };

        this.getTagId = function(class_info){
            var id = 0;
            for(var i = 0; i < ALL_TAGS.length; i++){
                if(ALL_TAGS[i].test(class_info)) id = id | (1 << i);
            }
            return id;
        }

        this.getTags = function(class_info){
            if(!class_info) return ALL_TAGS.slice();
            var matchingTags = [];
            var categories = [];
            for(var i = 0; i < ALL_TAGS.length; i++){
                if(ALL_TAGS[i].category && categories.indexOf(ALL_TAGS[i].category) > -1) continue;
                if(ALL_TAGS[i].test(class_info)){
                    matchingTags.push(ALL_TAGS[i]);
                    if(ALL_TAGS[i].category) categories.push(ALL_TAGS[i].category);
                }
            }
            return matchingTags;
        }

        this.openClassModal = function(data){
            return $uibModal.open({
              animation: false,
              ariaLabelledBy: 'modal-title',
              ariaDescribedBy: 'modal-body',
              templateUrl: '../../templates/class_modal.html',
              size: 'md',
              controller: 'ClassCtrl',
              resolve: {
                class_data: function() { return data; }
              }
            });
        }

        this.tagFilter = function(value, filters){
            for(var i = 0; i < filters.length; i++){
                if(!filters[i].test(value)) return false;
            } 
            return true;
        }

        var ALL_TAGS = [
            {name: "Aerial", category: "Category", test: function(e){ return /(static)|(silks)|(straps)|(web)|(sling)|(rope)|(lyra)|aerial/i.test(e.class_name); }, icon: "info-circle", description: "" },
            {name: "Ground", category: "Category", test: function(e){ return /(juggling)|(ground)|(balancing)/i.test(e.class_name); }, icon: "info-circle", description: "" },
            {name: "All Day", category: "Format", test: function(e){ return /all day/i.test(e.class_name); }, icon: 'cog', description: "All day circus experience." },
            {name: "Show", category: "Format", test: function(e){ return /show/i.test(e.class_name); }, icon: 'cog', description: "" },
            {name: "Camp", category: "Format", test: function(e){ return /camp/i.test(e.class_name); }, icon: 'cog', description: "" },
            {name: "Workshop", category: "Format", test: function(e){ return /workshop/i.test(e.class_name); }, icon: 'cog', description: "" },
            {name: "Open Studio", category: "Format", test: function(e){ return /^open/i.test(e.class_name); }, icon: 'cog', description: "Supervised practice. No new instruction." },
            {name: "Conditioning", category: "", test: function(e){ return /conditioning/i.test(e.class_name); }, icon: 'eye', description: "" },
            {name: "Handstand", category: "", test: function(e){ return /handstand/i.test(e.class_name); }, icon: 'eye', description: "" },
            {name: "Duo", category: "", test: function(e){ return /(duo)|(doubles)/i.test(e.class_name); }, icon: 'handshake-o', description: "" },
            {name: "Flying Trapeze", category: "", test: function(e){ return /flying trapeze/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Static Trapeze", category: "", test: function(e){ return /static/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Trampoline", category: "", test: function(e){ return /trampoline/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Straps", category: "", test: function(e){ return /straps/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Partner Balancing", category: "", test: function(e){ return /balancing/i.test(e.class_name); }, icon: 'handshake-o', description: "" },
            {name: "Juggling", category: "", test: function(e){ return /juggling/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Silks", category: "", test: function(e){ return /(silks)|(sling)/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Lyra", category: "", test: function(e){ return /lyra/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Sling", category: "", test: function(e){ return /sling/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Spanish Web", category: "", test: function(e){ return /web/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Rope", category: "", test: function(e){ return /rope/i.test(e.class_name); }, icon: 'book', description: "" },
            {name: "Kids", category: "Level", test: function(e){ return /kids/i.test(e.class_name); }, icon: 'child', description: "Kids only." },
            {name: "Intermediate", category: "Level", test: function(e){ return /(level[\s]?2)|(level[\s]?3)|(intermediate)/i.test(e.class_name); }, icon: 'level-up', description: "" },
            {name: "Beginner", category: "Level", test: function(e){ return /beginner/i.test(e.class_name); }, icon: 'smile-o', description: "Geared towards beginners." },
            {name: "All levels", category: "Level", test: function(e){ return !/(beginner)|(level[\s]?2)|(level[\s]?3)|(intermediate)|(restriction)|(prereq)/i.test(e.class_name); }, icon: 'thumbs-up', description: "Open to all levels." },
            {name: "Outdoors", category: "Location", test: function(e){ return /outdoor/i.test(e.class_name); }, icon: 'sun-o', description: "" },
            {name: "Indoors", category: "Location", test: function(e){ return !/outdoor/i.test(e.class_name); }, icon: 'home', description: "" },
            {name: "Morning", category: "Time", test: function(e){ return moment(e.start_time, "h:mmA").hour() <= 12; }, icon: 'clock-o', description: "" },
            {name: "Afternoon", category: "Time", test: function(e){ return moment(e.start_time, "h:mmA").hour() >= 12; }, icon: 'clock-o', description: "" },
            {name: "Evening", category: "Time", test: function(e){ return moment(e.start_time, "h:mmA").hour() >= 17; }, icon: 'clock-o', description: "" },
            {name: "Restriction", category: "Restriction", test: function(e){ return /(prereq)|(restrict)/i.test(e.class_name); }, icon: 'exclamation-triangle', description: "Some restrictions apply. Contact office." }
        ];
    }

// angular.module('RDash', ['ngRoute'])
// .service("ClassesService", function($http) {
//    this.getClasses = function(desired_date) {
//         return $http.get("/classes/" + desired_date).
//             then(function(response) {
//                 return response;
//             }, function(response) {
//                 alert("Error finding classes.");
//             });
//     }
//     // this.createContact = function(contact) {
//     //     return $http.post("/contacts", contact).
//     //         then(function(response) {
//     //             return response;
//     //         }, function(response) {
//     //             alert("Error creating contact.");
//     //         });
//     // }
//     // this.getContact = function(contactId) {
//     //     var url = "/contacts/" + contactId;
//     //     return $http.get(url).
//     //         then(function(response) {
//     //             return response;
//     //         }, function(response) {
//     //             alert("Error finding this contact.");
//     //         });
//     // }
//     // this.editContact = function(contact) {
//     //     var url = "/contacts/" + contact._id;
//     //     console.log(contact._id);
//     //     return $http.put(url, contact).
//     //         then(function(response) {
//     //             return response;
//     //         }, function(response) {
//     //             alert("Error editing this contact.");
//     //             console.log(response);
//     //         });
//     // }
//     // this.deleteContact = function(contactId) {
//     //     var url = "/contacts/" + contactId;
//     //     return $http.delete(url).
//     //         then(function(response) {
//     //             return response;
//     //         }, function(response) {
//     //             alert("Error deleting this contact.");
//     //             console.log(response);
//     //         });
//     // }
// });