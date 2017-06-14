exports.generateQuestionFilter = function (query) {
    var site = query.site;
    if (site) {
        var parameters = {
            site: site
        };
        for (key in query) {
            parameters[key] = query[key];
        }
        return parameters;
    } else {
        return null;
    }
}