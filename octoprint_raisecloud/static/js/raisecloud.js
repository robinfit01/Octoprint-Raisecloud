$(function() {
  function RaiseCloudViewModel(parameters) {
    var self = this;
    self.settings = parameters[0];
    self.loginState = parameters[1];
    self.userName = ko.observable("");
    self.groupName = ko.observable("");
    self.groupOwner = ko.observable("");
    self.showBind = ko.observable(true);
    self.showInput = ko.observable(false);
    self.fileName = ko.observable("");
    self.printer_name = ko.observable("");
    self.disabled = ko.observable(true);

    self.turnRaise = function() {
      window.open("http://cloud.raise3d.com/raise3d.html");
    };

    self.uploadFile = function() {
      let fileName = $("#fileUpload")[0].files[0].name;
      let fileSize = $("#fileUpload")[0].files[0].size;
      let extName = fileName
        .substr(fileName.lastIndexOf(".") + 1)
        .toLowerCase();
      if (extName != "raisepem" || fileSize > 2 * 1024) {
        $("#bindPageMsg")
          new PNotify({
            title: gettext("RaiseCloud printer binding key error"),
            text: gettext("Please upload the correct binding key file."),
            type: "error"
            });
        self.fileName("");
        $("#fileUpload").val("");
      } else {
        self.fileName(fileName);
        self.disabled(false);
      }
    };
    // 开始绑定
    self.bind = function() {
      if (!self.fileName()) {
        $("#bindPageMsg")
          new PNotify({
          title: gettext("RaiseCloud login warning"),
          text: gettext("Please select a binding key file."),
          type: "warning"
          });
      } else {
        var fileObj = document.getElementById("fileUpload").files[0];
        var formData = new FormData();
        formData.append("file", fileObj);
        $.ajax({
          type: "POST",
          contentType: false,
          url: PLUGIN_BASEURL + "raisecloud/login",
          data: formData,
          processData: false,
          dataType: "json",
          success: function(data) {
            if (data.status == "failed") {
              self.disabled(false);
              $("#bindPageMsg")
                new PNotify({
                  title: gettext("RaiseCloud login failed"),
                  text: gettext("The key you upload is not correct or your team has disbanded and your key is invalid"),
                  type: "error"
                  });
            } else {
              self.showBind(false);
              self.fileName("");
              $("#fileUpload").val("");
              self.userName(data.user_name);
              self.groupName(data.group_name);
              self.groupOwner(data.group_owner);
              self.printer_name(data.printer_name)
              $("#bindPageMsg")
                new PNotify({
                  title: gettext("RaiseCloud Login successful"),
                  text: gettext("The user has successfully logged in to RaiseCloud as" + self.userName()),
                  type: "success"
                  });
            }
          },
          error: function(error) {
            self.disabled(false);
            $("#bindPageMsg")
              new PNotify({
                  title: gettext("RaiseCloud login failed"),
                  text: gettext("Account error, please check if the binding key file is correct."),
                  type: "error"
                  });
          }
        });
      }
    };
    self.editPrintName = function() {
      self.showInput(true);
    };
    (function() {
      $.ajax({
        type: "GET",
        contentType: "application/json; charset=utf-8",
        url: PLUGIN_BASEURL + "raisecloud/status",
        data: {},
        dataType: "json",
        success: function(data) {
          if (data.status == "logout") {
            self.showBind(true);
          } else {
            console.log("user login");
            self.showBind(false);
            self.userName(data.user_name);
            self.groupName(data.group_name);
            self.groupOwner(data.group_owner);
            self.printer_name(data.printer_name);
          }
        },
        error: function(error) {}
      });
    })();
    //edit文本框的blur事件
    self.onPrintName = function() {
      if (!$(".input").val()) {
        $("#successPageMsg")
          new PNotify({
            title: gettext("Change printer name warning"),
            text: gettext("The printer name cannot be empty."),
            type: "warning"
            });
      } else {
        $.ajax({
          type: "POST",
          contentType: "application/json; charset=utf-8",
          url: PLUGIN_BASEURL + "raisecloud/printer",
          data: JSON.stringify({
            printer_name: $(".input").val()
          }),
          dataType: "json",
          success: function(data) {
            if (data.status == "failed") {
              self.showInput(true);
              $("#successPageMsg")
                new PNotify({
                  title: gettext("Change printer name failed"),
                  text: gettext("Please modify the printer name or try again."),
                  type: "error"
                  });
            } else {
              self.showInput(false);
              self.printer_name($(".input").val());
              new PNotify({
                  title: gettext("Change printer name successful"),
                  text: gettext("The printer name is updated to RaiseCloud successfully."),
                  type: "success"
                  });
            }
          },
          error: function(error) {
            $("#successPageMsg")
              new PNotify({
                  title: gettext("Change printer name failed"),
                  text: gettext("Please modify the printer name or try again."),
                  type: "error"
                  });
          }
        });
      }
    };
    //unbind
    self.unbind = function() {
      console.log("unbind");
      self.showBind(true);
      $.ajax({
        type: "POST",
        contentType: "application/json; charset=utf-8",
        url: PLUGIN_BASEURL + "raisecloud/logout",
        data: {},
        dataType: "json",
        success: function(data) {
          if (data.status == "logout") {
            self.fileName("");
            $("#fileUpload").val("");
            self.showBind(true);
            new PNotify({
              title: gettext("RaiseCloud Logout successful"),
              text: gettext("You are logged out of RaiseCloud."),
              type: "success"
              });

          } else {
            self.showBind(false);
            console.log(self.showBind());
            $("#successPageMsg")
            new PNotify({
              title: gettext("RaiseCloud Logout failed"),
              text: gettext("Fail to Log out"),
              type: "error"
              });
          }
        },
        error: function(error) {
          console.log(self.showBind());
          $("#successPageMsg")
          new PNotify({
            title: gettext("RaiseCloud Logout failed"),
            text: gettext("Fail to Log out"),
            type: "error"
            });
        }
      });
    };
    /* Event */
    self.onDataUpdaterPluginMessage = function (plugin, message) {
        if (plugin == "RaiseCloud") {
            switch (message.event) {
                case "Login":
                    self.showBind(false);
                    break;
                case "Logout":
                    new PNotify({
                    title: gettext("RaiseCloud remote logout."),
                    text: gettext(message.data),
                    type: "success"
                    });
                    self.showBind(true);
                    break;
                case "ChangeName":
                    self.printer_name(message.data);
                    new PNotify({
                    title: gettext("Change RaiseCloud printer name successful"),
                    text: gettext("The printer name is modified successfully, and RaiseCloud will update the printer name synchronously."),
                    type: "success"
                    });
                    break;
                case "ChangeProfile":
                    new PNotify({
                    title: gettext("Change octoprint profile successful"),
                    text: gettext("The printer profile modified successfully in RaiseCloud."),
                    type: "success"
                    });
                    break;
                default:
                    break;
            }
        }
    };

  }

  // view model class, parameters for constructor, container to bind to
  OCTOPRINT_VIEWMODELS.push([
    RaiseCloudViewModel,
    ["settingsViewModel", "loginStateViewModel"],
    ["#settings_plugin_raisecloud"]
  ]);
});
