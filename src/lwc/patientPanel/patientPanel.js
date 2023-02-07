import {LightningElement, track} from 'lwc';
import getPatientsResponse from '@salesforce/apex/PatientPanelController.getPatientsResponse';
import updatePatientData from '@salesforce/apex/PatientPanelController.updatePatientData';


import patientMedicationsViewModal from 'c/patientMedicationsViewModal';
import {ShowToastEvent} from "lightning/platformShowToastEvent";

const columns = [
    {label: 'First Name', fieldName: 'FirstName__c'},
    {label: 'Last Name', fieldName: 'LastName__c'},
    {label: 'Age', fieldName: 'Age__c'},
    {label: 'Town', fieldName: 'Town__c'},
    {
        label: 'Temperature F°',
        fieldName: 'Temperature__c',
        type: 'number',
        editable: true,
        cellAttributes: {
            alignment: 'left'
        }
    },
    {
        label: 'Pulse BPM',
        fieldName: 'Pulse__c',
        type: 'number',
        editable: true,
        cellAttributes: {
            alignment: 'left'
        }
    },
    {
        label: 'Medications',
        type: 'button',
        typeAttributes: {
            label: 'View',
            variant: 'base',
            name: 'view'
        }
    },
    {
        label: 'Action',
        type: 'button',
        typeAttributes: {
            label: 'Submit',
            variant: 'brand',
            name: 'submit',
            disabled: {fieldName: 'isSubmitDisabled'}
        }
    }
];

export default class PatientPanel extends LightningElement {

    @track data;

    columns = columns;
    draftValues = [];
    renderSpinner = false;
    errors = {rows: {}};

    async connectedCallback() {
        try {
            this.renderSpinner = true;
            const response = await getPatientsResponse();
            this.data = response.map((row) => {
                return {...row, isSubmitDisabled: this.submitTemperaturePulse}
            });
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

    async handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        switch (action.name) {
            case 'submit':
                this.submitTemperaturePulse(row);
                break;
            case 'view':
                await this.viewMedicationResponse(row);
                break;
            default:
        }
    }

    async submitTemperaturePulse(row) {
        this.draftValues = this.datatable.draftValues;
        const rowIndex = this.data.findIndex(_ => _.Id === row.Id);
        const {Id, ...rest} = this.draftValues.find(_ => _.Id === row.Id);
        if (!this.validate(Id, rest)) {
            return;
        }
        try {
            this.renderSpinner = true;
            const response = await updatePatientData({
                patientId: Id,
                body: JSON.stringify(rest)
            });
            this.data[rowIndex] = Object.assign(this.data[rowIndex], response);
            this.data[rowIndex].isSubmitDisabled = true;
            this.draftValues = this.draftValues.filter(_ => _.Id !== Id);

            const evt = new ShowToastEvent({
                title: 'Success',
                message: 'Patient has been updated!',
                variant: 'success',
            });
            this.dispatchEvent(evt);

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

    async viewMedicationResponse(row) {
        await patientMedicationsViewModal.open({
            label: `Medications for ${row.FirstName__c} ${row.LastName__c}`,
            size: 'small',
            patientId: row.Id
        });
    }

    handleEdit(event) {
        const rowIndex = this.data.findIndex(_ => _.Id === event.detail.draftValues[0].Id);
        this.data[rowIndex].isSubmitDisabled = false;
    }

    get datatable() {
        return this.template.querySelector('lightning-datatable');
    }

    validate(patientId, data) {
        const pulse = {
            errorMessage: 'Please verify pulse and try again. The valid range is between 30 and 250 BPM.',
            fieldName: 'Pulse__c',
            isValid: data.Pulse__c ? this.isPulseValid(data.Pulse__c): true
        };
        const temperature = {
            errorMessage: 'Please verify temperature and try again. The valid range is between 95° and 107.6°.',
            fieldName: 'Temperature__c',
            isValid: data.Temperature__c ? this.isTemperatureValid(data.Temperature__c): true
        };
        const itemsToVerify = [pulse, temperature];
        const errorObject = itemsToVerify.reduce((state, {errorMessage, fieldName, isValid}) => {
            if (!isValid) {
                state.messages.push(errorMessage);
                state.fieldNames.push(fieldName);
            }
            return state;
        }, {title: 'We found some errors.', messages: [], fieldNames: []});
        if (errorObject.fieldNames.length > 0) {
            this.errors.rows[patientId]= errorObject;
            return false;
        } else {
            delete this.errors.rows[patientId];
            return true;
        }
    }

    isPulseValid(value) {
        return value <= 250 && value >= 30;
    }

    isTemperatureValid(value) {
        return value <= 107.6 && value >= 95;
    }
}
