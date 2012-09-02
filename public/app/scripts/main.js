//  (c) 2012 Cole Krumbholz, SendSpree Inc.
//
//  This document may be used and distributed in accordance with 
//  the MIT license. You may obtain a copy of the license at 
//    http://www.opensource.org/licenses/mit-license.php


// render_layout(contentView, menuView):
// renders the contentView into the main layout template
// and optionally renders a menu into the titlebar. It
// only renders the layout template the first time.

(function (window, document, $, _, App) {
    var renderLayout = function (contentView, menuView) {

        if (!App.layoutView) {

            // the top titlebar, may contain a menu
            App.titlebarView = new App.CommonView({
                template:JST.titlebar,
                subviews:{
                    "#menu":menuView
                }
            });

            // the main layout view where all content goes
            App.layoutView = new App.CommonView({
                template:JST.layout,
                subviews:{
                    "#titlebar":App.titlebarView,
                    "#content":contentView
                }
            });

            $('body').append(App.layoutView.render().el);

        } else {
            App.layoutView.renderSubview("#content", contentView);
            App.titlebarView.renderSubview("#menu", menuView);
        }

    };


    (function (App) {
        
        var menuConfig = {home:"/", add:"/add"};

        var RecordType = Backbone.Model.extend({
            urlRoot: '/backliftapp/phonebook'
        });

        var Phonebook = Backbone.Collection.extend({
            url: '/backliftapp/phonebook'
        });

        function factoryAddEditView(model, template, router) {
            return new App.CommonView({
                template:template,
                model: model,
                events: {
                    "submit #contact-form": function(e) {
                        e.preventDefault();
                        _.each($(e.target).serializeArray(), function(v) {
                            model.set(v.name, v.value);
                        });
                        model.save({success: function() {
                            router.navigate('', {trigger: true});
                        }});
                    },
                    "click a.cancel": function(e) {
                        e.preventDefault();
                        $('#contact-form').get(0).reset();
                    }
                }
            });
        }
        
        App.MainRouter = Backbone.Router.extend({

            routes: {
                "": "home",
                "add": "add",
                "edit/:id": "edit",
                "delete/:id": "delete",
                "*path": "notFoundHandler"
            },

            "home": function () {

                var collection = new Phonebook();

                var homeView = new App.CommonView({
                    template:JST.home,
                    render_on: "add reset remove",
                    collection: collection
                });

                var menu = App.make_menu(JST.menu, {
                    options: menuConfig,
                    current:"home"
                }, this);

                collection.fetch();

                renderLayout(homeView, menu);
            },

            "add": function () {

                var model = new RecordType(),
                    addView = factoryAddEditView(model, JST.add, this),
                    menu = App.make_menu(JST.menu, {
                        options: menuConfig,
                        current:"add"
                    }, this);

                renderLayout(addView, menu);
            },

            "edit": function(id) {
                var model = new RecordType({id: id}),
                    editView = factoryAddEditView(model, JST.edit, this),
                    menu = App.make_menu(JST.menu, {
                        options: menuConfig,
                        current:"edit"
                    }, this);

                model.fetch({success: function () {
                    renderLayout(editView, menu);
                }});
            },

            "delete": function(id) {
                var model = new RecordType({id: id}),
                    router = this;
                model.destroy({success: function() {
                    router.navigate('', {trigger: true});
                }});
            },

            // notFoundHandler: any invalid url will be redirected
            // here

            notFoundHandler:function (path) {
                window.location.replace("/backlift/error/404/" + path);
            }

        });
    })(App);

    $(function () {
        App.mainRouter = new App.MainRouter();
        Backbone.history.start({pushState:true});
        $(document).on('click', 'a.backboned', function(e) {
            e.preventDefault();
            App.mainRouter.navigate($(e.currentTarget).attr('href'), {trigger: true});
        });
    });
    
})(this, this.document, this.jQuery, this._, this.App);