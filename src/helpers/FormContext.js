import ControlRecordTreeMgr from './ControlRecordTreeMgr';

export default class FormContext {

  constructor(formData) {
    this.formData = formData;
  }

  hasContainConcept(record, conceptName) {
    const concept = record.control && record.control.concept;
    return concept && concept.name === conceptName;
  }

  findRecordsByConceptName(recordTree, conceptName) {
    let recordArray = [];
    if (this.hasContainConcept(recordTree, conceptName)) {
      recordArray.push(recordTree);
    }
    if (recordTree.children) {
      recordTree.children.forEach(r => {
        const filteredArray = this.findRecordsByConceptName(r, conceptName);
        recordArray = recordArray.concat(filteredArray);
      });
    }
    return recordArray;
  }

  get(conceptName, position = 0) {
    const recordArray = this.findRecordsByConceptName(this.formData, conceptName);
    return recordArray[position];
  }

  set(conceptName, position, key, value) {
    const currentTree = this.get(conceptName, position);
    if (currentTree) {
      const updatedCurrentTree = currentTree.set(key, value);
      this.formData = ControlRecordTreeMgr.update(this.formData, updatedCurrentTree);
    }
  }

  getData() {
    return this.formData;
  }

}
