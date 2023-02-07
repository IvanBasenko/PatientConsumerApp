public with sharing class HttpCalloutHandler {

    public enum RestMethod {
        GET,
        POST,
        PUT
    }

    private HttpRequest request;
    private HttpResponse response;
    private Integer defaultTimeout = 120000;


    public void setRequestTimeout(Integer timeout) {
        this.defaultTimeout = timeout;
    }

    public HttpRequest buildRequest(
            RestMethod method,
            String endpoint,
            Map<String, String> headers
    ) {
        this.request = new HttpRequest();
        this.request.setMethod(method.name());
        this.request.setEndpoint(endpoint);
        this.request.setTimeout(this.defaultTimeout);

        for (String headerName : headers.keySet()) {
            this.request.setHeader(headerName, headers.get(headerName));
        }

        return this.request;
    }


    public HttpResponse sendRequest(HttpRequest request) {
        Http http = new Http();
        this.response = http.send(request);
        return this.response;
    }


    public HttpResponse getResponse() {
        return this.response;
    }

    public Integer getResponseStatusCode() {
        return this.response?.getStatusCode();
    }

    public String getResponseBody() {
        return this.response?.getBody();
    }

}
