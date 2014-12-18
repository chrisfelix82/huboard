
// Create our Application
(function () {
  
  App = Ember.Application.create({
    rootElement : "#main-application"
  })

  App.User = Ember.Object.extend({

    gravatar_url : function() {
      return this.get("avatar_url")

    }.property("avatar_url"),

    loadDetails : function () {
      var user = this; 
      return Em.Deferred.promise(function(p) {
        p.resolve($.getJSON("/api/profiles/user").then(function (response) {
          user.set("details", response)
          return response;
        }));
      });
    },
    loadHistory : function () {
      var user = this; 
      return Em.Deferred.promise(function(p) {
        p.resolve($.getJSON("/api/profiles/"+ user.get("login") + "/history").then(function (response) {
          user.set("history", response)
          return response;
        }));
      });
    }

  })

  App.Org = Ember.Object.extend({

    gravatar_url : function() {
      return this.get("avatar_url") 

    }.property("avatar_url"),

    loadDetails : function () {
      var org = this; 
      return Em.Deferred.promise(function(p) {
        p.resolve($.getJSON("/api/profiles/"+ org.get("login")).then(function (response) {
          org.set("details", response)
          return response;
        }));
      });
    },
    loadHistory : function () {
      var org = this; 
      return Em.Deferred.promise(function(p) {
        p.resolve($.getJSON("/api/profiles/"+ org.get("login") + "/history").then(function (response) {
          org.set("history", response)
          return response;
        }));
      });
    }

  })

  App.IndexRoute = Ember.Route.extend({
    model : function () {
      var model = this.modelFor("application");
      return model.user;
    },

    afterModel: function (model) {
      return model.loadDetails().then(function(){
        return model.loadHistory();
      });
    }
  })

  App.Router.map(function(){
    this.resource("profile", { path: "/:profile_id" });
    //this.resource("profile")
  })
  App.ProfileRoute = Ember.Route.extend({
    model: function(params) {

      var profiles = this.modelFor("application");
      return profiles.orgs.find(function(item) {
        return item.login == params.profile_id;                   
      });

    },
    serialize: function (model) {
      return { profile_id: model.get("login")}
    },

    afterModel : function (model) {
      return model.loadDetails().then(function(){
        return model.loadHistory();
      });
    }
  })

  App.HistoryController = Ember.ObjectController.extend({
    actions: {
      saveAdditionalInfo: function (model) {
        controller = this;
        controller.set("processing", true);
        return new Ember.RSVP.Promise(function(resolve, reject){
          Ember.$.ajax({
            url: "/settings/profile/" + model.get("login") + "/additionalInfo",
            type: "PUT",
            data: {
              additional_info: model.get("history.additional_info")
            },
            success: function(response){
              resolve(response);
              controller.set("processing", false);
            },
            error: function(response){
              reject(response);
              controller.set("processing", false);
            }
          })
        })
      }
    }
  });

  App.AccountController = Ember.ObjectController.extend({
    needs: ["purchaseForm","cancelForm", "updateCard", "applyCoupon"],  
    couponCode: function(){
      return this.get("model.details.discount.coupon.id");
    }.property("model.details.discount","model.details.discount.coupon", "model.details.discount.coupon.id"),
    actions: {
      purchase: function (model) {
        var org = this.get("model.details.org");
        var details = this.get('model.details');
        plan = Ember.Object.create({plan: model, org:org, details: details})
        this.set("controllers.purchaseForm.model", plan)
        this.send("openModal","purchaseForm")
      },
      updateCard: function (model) {
        var org = this.get("model.details.org");
        card = Ember.Object.create({card: model, org:org})
        this.set("controllers.updateCard.model", card)
        this.send("openModal","updateCard")
      },
      cancel: function (model) {
        var org = this.get("model.details.org");
        var details = this.get('model.details');
        plan = Ember.Object.create({plan: model, org:org, details: details})
        this.set("controllers.cancelForm.model", plan)
        this.send("openModal","cancelForm")
      
      },
      applyCoupon: function (model) {
        this.set("controllers.applyCoupon.model", model)
        this.send("openModal","applyCoupon");
      }
    }  
  });

  App.XTabsComponent = Ember.Component.extend({
    init: function() {
      this._super.apply(this, arguments);
      this.panes = [];
    },

    addPane: function(pane) {
      if (this.get('panes.length') == 0) this.select(pane);
      this.panes.pushObject(pane);
    },

    select: function(pane) {
      this.set('selected', pane);
    }

  });

  App.XPaneComponent = Ember.Component.extend({
    didInsertElement: function() {
      this.get('parentView').addPane(this);
    },

    selected: function() {
      return this.get('parentView.selected') === this;
    }.property('parentView.selected')
  });

  App.animateModalClose = function() {
    var promise = new Ember.RSVP.defer();

    $('body').removeClass("fullscreen-open");
    promise.resolve();


    return promise.promise;
  };

  App.animateModalOpen = function() {
    var promise = new Ember.RSVP.defer();

     $('body').addClass("fullscreen-open");
    promise.resolve();
    

    return promise.promise;
  };

})(this);
