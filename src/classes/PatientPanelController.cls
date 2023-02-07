public with sharing class PatientPanelController {

    private static final String BASE_URL = 'callout:PatientApi';
    private static final String MEDICATIONS_URL = BASE_URL + '/{0}/medications';
    private static HttpCalloutHandler calloutHandler = new HttpCalloutHandler();

    @AuraEnabled(Cacheable=true)
    public static Object getPatientsResponse() {
        Object patientResponse;
        try {
            HttpRequest request = calloutHandler.buildRequest(
                    HttpCalloutHandler.RestMethod.GET,
                    BASE_URL,
                    new Map<String, String>{
                            'Content-Type' => 'application/json'
                    }
            );
            calloutHandler.sendRequest(request);
            if (calloutHandler.getResponseStatusCode() != 200) {
                throw new PatientResponseException(calloutHandler.getResponse().toString()
                        + calloutHandler.getResponseBody());
            }
            patientResponse = (List<Object>) JSON.deserializeUntyped(calloutHandler.getResponseBody());
        } catch (Exception ex) {
            rethrowAuraException(ex.getMessage());
        }
        return patientResponse;
    }

    @AuraEnabled(Cacheable=true)
    public static Object getMedicationsResponse(String patientId) {
        Object medicationsResponse;
        try {
            HttpRequest request = calloutHandler.buildRequest(
                    HttpCalloutHandler.RestMethod.GET,
                    String.format(MEDICATIONS_URL, new List<String>{
                            patientId
                    }),
                    new Map<String, String>{
                            'Content-Type' => 'application/json'
                    }
            );
            calloutHandler.sendRequest(request);
            if (calloutHandler.getResponseStatusCode() != 200) {
                throw new PatientResponseException(calloutHandler.getResponse().toString()
                        + calloutHandler.getResponseBody());
            }
            medicationsResponse = (List<Object>) JSON.deserializeUntyped(calloutHandler.getResponseBody());
        } catch (Exception ex) {
            rethrowAuraException(ex.getMessage());
        }
        return medicationsResponse;
    }

    @AuraEnabled
    public static Object updatePatientData(String patientId, String body) {
        Object patientResponse;
        try {
            HttpRequest request = calloutHandler.buildRequest(
                    HttpCalloutHandler.RestMethod.PUT,
                    BASE_URL + '/' + patientId,
                    new Map<String, String>{
                            'Content-Type' => 'application/json'
                    }
            );
            request.setBody(body);
            calloutHandler.sendRequest(request);
            if (calloutHandler.getResponseStatusCode() != 200) {
                throw new PatientResponseException(calloutHandler.getResponse().toString()
                        + calloutHandler.getResponseBody());
            }
            patientResponse = (Map<String, Object>) JSON.deserializeUntyped(calloutHandler.getResponseBody());
        } catch (Exception ex) {
            rethrowAuraException(ex.getMessage());
        }
        return patientResponse;
    }

    public class PatientResponseException extends Exception {
    }

    public static AuraHandledException rethrowAuraException(String message) {
        AuraHandledException ex = new AuraHandledException(message);
        ex.setMessage(message);

        throw ex;
    }
}
