angular.module('app').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('public/app/templates/account.html',
    "\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "\t<div class=\"col-md-12\">\n" +
    "\t\t<h2 style=\"margin-top: 0px;\">My Account</h2>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "\t\n" +
    "\t<div class=\"col-sm-4 col-sm-push-8 form-sidebar\">\n" +
    "\n" +
    "\t</div>\n" +
    "\t<div class=\"col-sm-8 col-sm-pull-4\">\n" +
    "\n" +
    "\t\t\n" +
    "\t\t<div class=\"alert alert-success alert-dismissable\" ng-show=\"saved\">\n" +
    "\t\t\t<button type=\"button\" class=\"close\" ng-click=\"saved=false\" data-dismiss=\"alert\" aria-hidden=\"true\">&times;</button>\n" +
    "\t\t\t<strong>Success!</strong> Your changes have been saved.\n" +
    "\t\t</div>\n" +
    "\t\t\n" +
    "\n" +
    "\t\t\n" +
    "\t\t<form name=\"acctForm\" \n" +
    "\t\t\t\trole=\"form\" \n" +
    "\t\t\t\tclass=\"jgs-form\" \n" +
    "\t\t\t\tng-submit=\"save(currentUser)\" novalidate >\n" +
    "\t\t\n" +
    "\t\t\t<div class=\"row\">\n" +
    "\t\t\t\t<div class=\"col-md-6\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>First Name</label>\n" +
    "\t\t\t\t\t\t<input name=\"fname\" type=\"text\" required class=\"form-control\" popover=\"{{errors.fname}}\" pop-placement=\"right\" ng-model=\"currentUser.fname\" popover-append-to-body>\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t\t<div class=\"col-md-6\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>Last Name</label>\n" +
    "\t\t\t\t\t\t<input name=\"lname\" type=\"text\" required class=\"form-control\" pop-show=\"{{errors.lname}}\" pop=\"{{errors.lname}}\" pop-placement=\"right\" ng-model=\"currentUser.lname\" pop-append-to-body>\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t\t<div class=\"row\">\n" +
    "\t\t\t\t<div class=\"col-md-12\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>Email</label>\n" +
    "\t\t\t\t\t\t<input name=\"email\" type=\"email\" required class=\"form-control\" pop-show=\"{{errors.email}}\" pop=\"{{errors.email}}\" pop-placement=\"right\" ng-model=\"currentUser.email\" pop-append-to-body>\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t\t<div class=\"row\">\n" +
    "\t\t\t\t<div class=\"col-md-12\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>Password</label>\n" +
    "\t\t\t\t\t\t<input type=\"password\" name=\"pass\" class=\"form-control\" pop-show=\"{{errors.password}}\" pop=\"{{errors.password}}\" placeholder=\"Only enter to change.\" pop-placement=\"right\" ng-model=\"currentUser.password\" />\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\n" +
    "\t\t\t<div class=\"form-group btns\">\n" +
    "\t\t\t\t<button type=\"submit\" class=\"btn btn-success pull-right\">Save</button>\n" +
    "\t\t\t</div>\n" +
    "\t\t\n" +
    "\t\t</form>\n" +
    "\t</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('public/app/templates/app.html',
    "home"
  );


  $templateCache.put('public/app/templates/chargebacks.html',
    "\n" +
    "<div class=\"row search\" style=\"margin-bottom: 20px;\">\n" +
    "\t<div class=\"col-md-8\">\n" +
    "\t\t<h2>My Chargebacks</h2>\n" +
    "\t</div>\n" +
    "\t<div class=\"col-md-4\" style=\"padding-top: 20px;\">\n" +
    "\t\t<input ng-model=\"q\" type=\"text\" class=\"form-control pull-right\" name=\"query\" autocomplete=\"off\" placeholder=\"Search\">\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "\n" +
    "<div class=\"animated-grid\">\n" +
    "\t<div class=\"row head\">\n" +
    "\t\t<div class=\"col-sm-1\">ID</div>\n" +
    "\t\t<div class=\"col-sm-3\">Date</div>\n" +
    "\t\t<div class=\"col-sm-2\">Amount</div>\n" +
    "\t\t<div class=\"col-sm-3\">Customer</div>\n" +
    "\t\t<div class=\"col-sm-3\">Status</div>\n" +
    "\t</div>\n" +
    "\n" +
    "\t<div class=\"row\" ng-repeat=\"cb in data | filter:q as results\">\n" +
    "\t\t<div class=\"col-sm-1\"><a href=\"/chargeback/{{cb._id}}\">{{cb._id}}</a></div>\n" +
    "\t\t<div class=\"col-sm-3\">{{cb.date | date:'medium'}}</div>\n" +
    "\t\t<div class=\"col-sm-2\">{{cb.amount | currency}}</div>\n" +
    "\t\t<div class=\"col-sm-3\">{{cb.customer}}</div>\n" +
    "\t\t<div class=\"col-sm-3\" style=\"color: {{cb.status.color}}\">{{cb.status.name}}</div>\n" +
    "\t</div>\n" +
    "\t\n" +
    "\t<div class=\"row\" ng-if=\"results.length == 0\">\n" +
    "\t\t<div class=\"col-sm-12\"><strong>No results found...</strong></div>\n" +
    "\t</div>\t\n" +
    "</div>\n"
  );


  $templateCache.put('public/app/templates/footer.html',
    "\n" +
    "<!-- FOOTER -->\n" +
    "<div class=\"container\">\n" +
    "\t<footer>\n" +
    "\t\t<p>&copy; 2014 chargeback.com &middot; <a href=\"/privacy\">Privacy</a> &middot; <a href=\"/terms\">Terms</a></p>\n" +
    "\t</footer>\n" +
    "</div>"
  );


  $templateCache.put('public/app/templates/forgot.html',
    "\n" +
    "<h3>Reset Your Password</h3>\n" +
    "\t\n" +
    "<div class=\"row\">\n" +
    "\t\n" +
    "\t<div class=\"col-sm-4 col-sm-push-8 form-sidebar\">\n" +
    "\n" +
    "\t</div>\n" +
    "\t<div class=\"col-sm-8 col-sm-pull-4\">\n" +
    "\t\t\n" +
    "\t\t<div ng-hide=\"data.sent\" style=\"padding-bottom: 30px;\">Enter your email and we'll send you a link to reset your password.</div>\n" +
    "\t\t<div ng-show=\"data.sent\" class=\"alert alert-success\">An email has been sent with a link to reset your password.</div>\n" +
    "\n" +
    "\n" +
    "\t\t<form name=\"forgotForm\" \n" +
    "\t\t\t\trole=\"form\" \n" +
    "\t\t\t\tclass=\"jgs-form\" \n" +
    "\t\t\t\tng-submit=\"forgot(data)\" novalidate >\n" +
    "\t\t\t\n" +
    "\t\t\t<div class=\"row\" ng-hide=\"data.sent\">\n" +
    "\t\t\t\t<div class=\"col-md-12\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>Email</label>\n" +
    "\t\t\t\t\t\t<input name=\"email\" type=\"email\" required class=\"form-control\" pop-show=\"{{errors.email}}\" pop=\"{{errors.email}}\" pop-placement=\"right\" ng-model=\"data.email\" pop-append-to-body>\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t\t\n" +
    "\t\t\t<div class=\"form-group btns\" ng-hide=\"data.sent\">\n" +
    "\t\t\t\t<button type=\"submit\" class=\"btn btn-success pull-right\">Send Reset Link</button>\n" +
    "\t\t\t</div>\n" +
    "\n" +
    "\t\t</form>\n" +
    "\n" +
    "\t</div>\n" +
    "\n" +
    "</div>"
  );


  $templateCache.put('public/app/templates/home.html',
    "<h3>Homepage</h3>"
  );


  $templateCache.put('public/app/templates/login.html',
    "\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "\t<div class=\"col-md-12\">\n" +
    "\t\t<h2 style=\"margin-top: 0px;\">Login</h2>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"row\">\n" +
    "\t\n" +
    "\t<div class=\"col-sm-4 col-sm-push-8 form-sidebar\">\n" +
    "\n" +
    "\t</div>\n" +
    "\t<div class=\"col-sm-8 col-sm-pull-4\">\n" +
    "\n" +
    "\t\t<!-- sink is hack to get browsers to prompt for password saving in keychain -->\n" +
    "\t\t<iframe src=\"sink\" name=\"sink\" style=\"display:none\"></iframe>\n" +
    "\n" +
    "\t\t<form name=\"loginForm\" \n" +
    "\t\t\t\taction=\"sink\" target=\"sink\" method=\"post\"\n" +
    "\t\t\t\trole=\"form\" \n" +
    "\t\t\t\tclass=\"jgs-form\" \n" +
    "\t\t\t\tng-submit=\"login(credentials)\" novalidate >\n" +
    "\t\t\n" +
    "\t\t\t<div class=\"row\">\n" +
    "\t\t\t\t<div class=\"col-md-12\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>Email</label>\n" +
    "\t\t\t\t\t\t<input name=\"email\" type=\"email\" required class=\"form-control\" pop-show=\"{{errors.email}}\" pop=\"{{errors.email}}\" pop-placement=\"right\" ng-model=\"credentials.email\" pop-append-to-body>\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\t\t\t<div class=\"row\">\n" +
    "\t\t\t\t<div class=\"col-md-12\">\n" +
    "\t\t\t\t\t<div class=\"form-group\" show-errors>\n" +
    "\t\t\t\t\t\t<label>Password</label>\n" +
    "\t\t\t\t\t\t<input type=\"password\" name=\"pass\" required class=\"form-control\" pop-show=\"{{errors.password}}\" pop=\"{{errors.password}}\" pop-placement=\"right\" ng-model=\"credentials.password\" />\n" +
    "\t\t\t\t\t</div>\n" +
    "\t\t\t\t</div>\n" +
    "\t\t\t</div>\n" +
    "\n" +
    "\t\t\t<div class=\"form-group btns\">\n" +
    "\t\t\t\t<a href=\"/forgot\">Forgot Password?</a>\n" +
    "\t\t\t\t<button type=\"submit\" class=\"btn btn-success pull-right\">Login</button>\n" +
    "\t\t\t</div>\n" +
    "\t\t\n" +
    "\t\t</form>\n" +
    "\t</div>\n" +
    "\n" +
    "</div>\n"
  );


  $templateCache.put('public/app/templates/nav.html',
    "\n" +
    "<div class=\"navbar navbar-inverse navbar-static-top\" role=\"navigation\">\n" +
    "\t<div class=\"container\">\n" +
    "\t\t<div class=\"navbar-header\">\n" +
    "\t\t\t<button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\".navbar-collapse\">\n" +
    "\t\t\t\t<span class=\"sr-only\">Toggle navigation</span>\n" +
    "\t\t\t\t<span class=\"icon-bar\"></span>\n" +
    "\t\t\t\t<span class=\"icon-bar\"></span>\n" +
    "\t\t\t\t<span class=\"icon-bar\"></span>\n" +
    "\t\t\t</button>\n" +
    "\t\t\t<a class=\"navbar-brand\" href=\"/\"><img src=\"/images/logo.png\"></a>\n" +
    "\t\t</div>\n" +
    "\n" +
    "\t\t<div class=\"navbar-collapse collapse\">\n" +
    "\t\t\t<p ng-if=\"currentUser\" class=\"navbar-text pull-right\">{{ currentUser.fullname }}</p>\n" +
    "\t\t\t<ul class=\"nav navbar-nav\" ng-if=\"!currentUser\">\n" +
    "\t\t\t\t<li ng-class=\"{active: $state.includes('login')}\"><a href=\"/login\">Login</a></li>\n" +
    "\t\t\t</ul>\n" +
    "\t\t\t<ul class=\"nav navbar-nav\" ng-if=\"currentUser\">\n" +
    "\t\t\t\t<li ng-class=\"{active: $state.includes('chargebacks')}\"><a href=\"/chargebacks\">My Chargebacks</a></li>\n" +
    "\t\t\t\t<li ng-class=\"{active: $state.includes('reports')}\"><a href=\"/reports\">Reports</a></li>\n" +
    "\t\t\t\t<li ng-class=\"{active: $state.includes('account')}\"><a href=\"/account\">Account</a></li>\n" +
    "\t\t\t\t<li><a href=\"/logout\">Log Out</a></li>\n" +
    "\t\t\t</ul>\n" +
    "\t\t</div>\n" +
    "\t</div>\n" +
    "</div>\n" +
    "\t"
  );

}]);
