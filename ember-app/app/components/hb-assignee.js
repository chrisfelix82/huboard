import Ember from 'ember';

var HbAssigneeComponent = Ember.Component.extend({
  classNames: ["hb-selector-component", "dropdown"],
  isOpen: function(){
    return false;
  }.property(),


  listItems: function () {

    return this.get("assignees")
    .filter(function(item) {
      var term = this.get("filterPeople") || "";
      return item.login.toLowerCase().indexOf(term.toLowerCase()|| item.login.toLowerCase()) !== -1;
    }.bind(this))
    .map(function(item) {

      return this.ListItem.create({
        selected: item.id === this.get("selected.id"),
        item: item
      });

    }.bind(this));

  }.property("assignees.[]","selected","filterPeople"),

  ListItem: Ember.Object.extend({
    selected: false,
    item: null
  }),

  actions: {
    toggleSelector: function(){
      this.set("isOpen", !!!this.$().is(".open"));
      if(this.get("isOpen")) {
        this.$().addClass("open");
        this.$(':input:not(.close):not([type="checkbox"])').first().focus();
        this.set("filterPeople", "");

      } else {
        this.$().removeClass("open");
      }
    },
    assignTo: function(assignee) {
      this.set("selected", assignee);
      this.sendAction("assign", assignee.login);
      this.$().removeClass("open");
      this.set("isOpen", false);
    },
    clearAssignee: function(){
      this.set("selected", null);
      this.sendAction("assign", "");
      this.$().removeClass("open");
      this.set("isOpen", false);
    }
  },
  didInsertElement: function() {
    Ember.$('body').on('keyup.flyout', function(event) {
      if (event.keyCode === 27){ this.set("isOpen", false); }
    }.bind(this));

    this.$(".hb-flyout").on('click.flyout', function(event){
      if(Ember.$(event.target).is("[data-ember-action],[data-toggle]")){return;}
      if(Ember.$(event.target).parents("[data-ember-action],[data-toggle]").length){return;}
      event.preventDefault();
      event.stopPropagation();  
      this.set("isOpen", false);
    }.bind(this));

    this.$(".close").on('click.flyout', function(event){
      if(Ember.$(event.target).is("[data-ember-action],[data-toggle]")){return;}
      if(Ember.$(event.target).parents("[data-ember-action],[data-toggle]").length){return;}
      this.set("isOpen", false);
    }.bind(this));
    /* jshint ignore:end */

  },

  willDestroyElement: function() {
    Ember.$('body').off('keyup.flyout');
    this.$(".hb-flyout,.close").off("click.modal");
  }

});

export default HbAssigneeComponent;
