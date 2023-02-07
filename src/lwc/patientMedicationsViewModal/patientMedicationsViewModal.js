import {api} from 'lwc';
import LightningModal from 'lightning/modal';
import getMedicationsResponse from '@salesforce/apex/PatientPanelController.getMedicationsResponse';

const columns = [
    {label: 'Medication', fieldName: 'medication'},
    {label: 'Dose', fieldName: 'dose'},
    {label: 'Start Date', fieldName: 'startDate', type: 'date'},
    {label: 'End Date', fieldName: 'endDate', type: 'date'},
];

export default class PatientMedicationsViewModal extends LightningModal {
    @api patientId;

    renderSpinner = false;
    data;
    columns = columns;
    async connectedCallback() {
        this.data = undefined;
        try {
            this.renderSpinner = true;
            const response = await getMedicationsResponse({patientId: this.patientId});
            this.data = this.parseResponse(response);
        } catch (error) {
            if (error.body && error.body.message) {
                console.error(error.body.message);
                this.error = error.body.message;
            } else {
                console.error(error);
                this.error = error;
            }
        } finally {
            this.renderSpinner = false;
        }
    }

    parseResponse(response = []) {
        return response.map(({Medication__r, ...row}) => {
            return {
                id: row.Id,
                medication: Medication__r.Name,
                dose: Medication__r.Dose__c,
                startDate: row.StartDate__c,
                endDate: row.EndDate__c
            };
        });
    }

}
