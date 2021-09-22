#!/bin/bash
export PORT=8080
export CLIENT_APP_ORIGIN=http://10.0.1.3:8081
export OAUTH2_SUCCESS_FORWARD=http://10.0.1.3:8081/ddosgrid
export OAUTH2_AUTHORIZE=https://www.csg.uzh.ch/ddosgrid/ddosdb/o/authorize/
export OAUTH2_TOKEN=https://www.csg.uzh.ch/ddosgrid/ddosdb/o/token/
export OAUTH2_CLIENTID=Eme9TOpmCp9XgvZN6uWTrdMyT5lXk8ffNXPH9REc
export OAUTH2_CLIENTSECRET=lYxYUQnWtUs6tm7Fn4KBISJZF8ZZ3SrnbFDHSy8wOTcf5nMIgwCACi0Oy5k8jxjcHfvDNbM3N0N39cwmJDQ6fvIzDzsMxfFP8oZaDuCqhFotAMtKFHDDHcL5RHyJzMYN
export OAUTH2_CALLBACK=http://10.0.1.3:8080/auth/provider/callback/
export DDOSDB_PROFILEINFO=https://www.csg.uzh.ch/ddosgrid/ddosdb/api/profileinfo
export DDOSDB_PCAPEXPORT=https://www.csg.uzh.ch/ddosgrid/ddosdb/
export DDOSDB_ATTACKTRACE_PATH=https://www.csg.uzh.ch/ddosgrid/ddosdb/api/attack-trace
export DDOSDB_FILTEREXPORT=https://www.csg.uzh.ch/ddosgrid/ddosdb/api/upload-filter_rules
export DDOSDB_HOST=www.csg.uzh.ch

node index.js
