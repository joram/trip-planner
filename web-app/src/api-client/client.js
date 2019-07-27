import line_utils from './line_utils'
import auth from"./auth"
import {do_graphql_call, log_graphql_errors, routes_from_graphql_response} from "./utils";

let EventEmitter = require('events').EventEmitter;
let emitter = new EventEmitter();

let url = "https://api.triptracks.io/graphql";
if (window.location.hostname === "localhost") {
    url = "http://127.0.0.1:8000/graphql";
}

let routes_by_hash = {};
let routes_by_pub_id = {};
let routes_by_search = {};


async function getRoutesPage(hash, zoom, page) {
    let page_size = 500;
    let query = `
    query get_routes_by_geohash {
      routes(geohash:"${hash}", zoom:${zoom}, page:${page}, pageSize:${page_size}){
        pubId
        bounds
        linesZoom${zoom}
        sourceImageUrl
      }
    }
  `;
    let body = JSON.stringify({query});
    return fetch(url, {
        method: 'POST',
        mode: "cors",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: body
    })
        .then(r => r.json())
        .then(data => {
            log_graphql_errors("get_routes_page", data);
            let routes = data.data.routes;
            if (routes === null) {
                console.log("failed to get routes");
                console.log(data);
                return {routes: [], lastPage: true}
            }
            return {
                routes: routes_from_graphql_response(data.data.routes, zoom, true),
                lastPage: routes.length !== page_size
            };
        });
}

export default {

    isLoggedIn: function(){
        return auth.isAuthed()
    },

    createUser: function (googleCreds) {
        googleCreds = JSON.stringify({googleCreds}).replace(/"/g, '\\"');
        let query = `mutation {
          createUser(googleCredentials: "${googleCreds}"){
            ok
            user {
              pubId
            }
            sessionToken {
              pubId,
              sessionKey
            }
          }
        }`;

        do_graphql_call(query, "create_user").then(data => {
            let sessionToken = data.data.createUser.sessionToken.sessionKey;
            auth.setSessionToken(sessionToken);
            emitter.emit("got_user");
        });

    },

    getRouteByHashZoomAndPubID: function (hash, zoom, pubId) {
        let key = `${hash}::${zoom}`;
        if (routes_by_hash[key] === undefined) {
            return undefined
        }
        return routes_by_hash[key].routes[pubId]
    },

    getRoutesByHash: function (hash, zoom) {
        let key = `${hash}::${zoom}`;
        if (routes_by_hash[key] !== undefined) {
            return
        }

        routes_by_hash[key] = {
            complete: false,
            routes: {},
        };


        let routes_got = 0;

        function get_page(page) {
            getRoutesPage(hash, zoom, page).then(data => {
                data.routes.forEach((route) => {
                    routes_by_hash[key].routes[route.pubId] = route;
                    emitter.emit("got_routes", {hash: hash, zoom: zoom, pubId: route.pubId});
                    emitter.emit(`got_route_${route.pubId}`, {hash: hash, zoom: zoom, pubId: route.pubId});
                    routes_got += 1;
                });
                if (!data.lastPage) {
                    get_page(page + 1)
                } else {
                    emitter.emit(`finished_getting_routes`, {hash: hash, zoom: zoom, num: routes_got});
                }
            })
        }

        get_page(0);
    },

    getRouteByID2: function (pub_id) {
        if (routes_by_pub_id[pub_id] === undefined) {
            console.log(`sorry, don't have ${pub_id}`);
            return {}
        }

        return routes_by_pub_id[pub_id]
    },

    getRouteByID: async function (pub_id) {

        if (pub_id === null) {
            console.log("dont have", pub_id);
            return null
        }
        if (routes_by_pub_id[pub_id] !== undefined) {
            console.log("have:", routes_by_pub_id[pub_id]);
            emitter.emit("got_route", pub_id);
            return routes_by_pub_id[pub_id]
        }

        let query = `
          query get_single_route {
            route(pubId:"${pub_id}", zoom:15){
              pubId
              name
              bounds
              description
              sourceImageUrl
            }
          }
        `;
        return do_graphql_call(query, "get_single_route").then(data => {
            let route = data.data.route;
            if (route === null) {
                return null
            }
            if (route.bounds === undefined) {
                return null
            }
            route.bounds = line_utils.string_to_bbox(route.bounds);
            routes_by_pub_id[pub_id] = route;
            emitter.emit("got_route", pub_id);
            return route

        });
    },

    getRoutesBySearch2: function (search_text) {
        return routes_by_search[search_text];
    },

    getRoutesBySearch: function (search_text) {
        let query = `
          query route_search {
            routesSearch(searchText:"${search_text}"){
              pubId
              name
              description
              bounds
              sourceImageUrl
            }
          }
        `;
        return do_graphql_call(query, "route_search").then(data => {
            routes_by_search[search_text] = routes_from_graphql_response(data.data.routesSearch, null, false);
            emitter.emit("got_search", {search_text: search_text});
            return routes_by_search[search_text];
        });
    },

    getBucketListRoutes: function () {
        let query = `
          query bucket_list_routes {
            bucketListRoutes{
              pubId
              name
              description
              bounds
              sourceImageUrl
            }
          }
        `;
        return do_graphql_call(query, "bucket_list_routes").then(data => {
            return routes_from_graphql_response(data.data.bucketListRoutes, null, false)
        });
    },

    addToBucketList: function (route_pub_id) {
        let query = `mutation { addBucketListRoute(routePubId: "${route_pub_id}"){ok} }`;
        let r = do_graphql_call(query, "add_to_bucket_list");
        console.log(r);
        return r
    },

    removeFromBucketList: function (route_pub_id) {
        let query = `mutation { removeBucketListRoute(routePubId: "${route_pub_id}"){ok} }`;
        let r = do_graphql_call(query, "remove_from_bucket_list");
        r.then(d => console.log(d));
        return r
    },

    subscribeGotRoutes: function (callback) {
        emitter.addListener("got_routes", callback);
    },

    subscribeGotRoutesWithPubId: function (callback, pubId) {
        emitter.addListener(`got_route_${pubId}`, callback);
    },

    subscribeFinishedGettingRoutes: function (callback) {
        emitter.addListener("finished_getting_routes", callback);
    },

    subscribeGotRouteByPubId: function (callback) {
        emitter.addListener("got_route", callback);
    },

    subscribeGotSearch: function (callback) {
        emitter.addListener("got_search", callback);
    },

    subscribeGotUser: function (callback) {
        emitter.addListener("got_user", callback);
    },

};