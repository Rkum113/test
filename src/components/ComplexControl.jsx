import React, { Component, PropTypes } from 'react';
import ComponentStore from 'src/helpers/componentStore';
import { Validator } from 'src/helpers/Validator';
import Spinner from 'src/helpers/Spinner';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import Constants from '../constants';

export class ComplexControl extends Component {
  constructor(props) {
    super(props);
    const hasErrors = false;
    this.state = { hasErrors };
  }

  shouldComponentUpdate(nextProps, nextState) {
    this.isValueChanged = this.props.value !== nextProps.value;
    if (this.props.enabled !== nextProps.enabled ||
      this.isValueChanged ||
      this.state.hasErrors !== nextState.hasErrors || this.state.loading !== nextState.loading) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    const errors = this._getErrors(this.props.value);
    if (this._hasErrors(errors)) {
      this.props.onChange(this.props.value, errors);
    }
  }

  _hasErrors(errors) {
    return !isEmpty(errors);
  }

  _getErrors(value) {
    if (this._isCreateByAddMore()) {
      return [];
    }
    const validations = this.props.validations;
    let controlDetails;
    if (value && value.indexOf('voided') > 0) {
      controlDetails = { validations, undefined };
    } else {
      controlDetails = { validations, value };
    }
    return Validator.getErrors(controlDetails);
  }

  _isCreateByAddMore() {
    return (this.props.formFieldPath.split('-')[1] !== '0');
  }

  _getFileType(fileType) {
    const pdfType = 'pdf';
    const imageType = 'image';
    if (fileType.indexOf(pdfType) !== -1) {
      return pdfType;
    }
    if (fileType.indexOf(imageType) !== -1) {
      return imageType;
    }
    return 'not_supported';
  }

  update(value) {
    const errors = this._getErrors(value);
    this.setState({ loading: false, hasErrors: this._hasErrors(errors) });
    this.props.onChange(value, errors);
  }

  handleChange(e) {
    e.preventDefault();
    this.setState({ loading: true });
    if (e.target.files === undefined) {
      this.update(undefined);
      return;
    }
    const file = e.target.files[0];
    const reader = new FileReader();
    const fileType = this._getFileType(file.type);
    if (fileType === 'not_supported') {
      this.update(undefined);
      this.props.showNotification(Constants.errorMessage.fileTypeNotSupported,
                                  Constants.messageType.error);
      return;
    }
    reader.onloadend = (event) => {
      this.uploadFile(event.target.result, this.props.patientUuid, fileType)
        .then((response) => response.json())
        .then(data => {
          this.update(data.url);
        });
    };
    reader.readAsDataURL(file);
    this.addControlWithNotification(true);
  }

  uploadFile(file, patientUuid, fileType) {
    const searchStr = ';base64';
    const format = file.split(searchStr)[0].split('/')[1];
    const url = '/openmrs/ws/rest/v1/bahmnicore/visitDocument/uploadDocument';
    return fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: file.substring(file.indexOf(searchStr) + searchStr.length, file.length),
        format,
        patientUuid,
        fileType: fileType || 'file',
      }),
      credentials: 'include',
    });
  }

  handleDelete() {
    this.update(`${this.props.value}voided`);
  }

  handleRestore() {
    this.update(this.props.value.replace(/voided/g, ''));
  }
  displayDeleteButton() {
    return (<button className="delete-button"
      onClick={(e) => this.handleDelete(e)}
    >
      <span className="fa fa-remove"></span>
    </button>);
  }
  displayRestoreButton() {
    return (<button className="restore-button"
      onClick={(e) => this.handleRestore(e)}
    >
      <span className="fa fa-undo"></span>
    </button>);
  }

  addControlWithNotification(isNotificationShown) {
    if (this.props.addMore && !this.hasBeenAddMore) {
      this.props.onControlAdd(this.props.formFieldPath, isNotificationShown);
      this.hasBeenAddMore = true;
    }
  }

  render() {
    let preview = null;
    let isPreviewHidden = true;
    let deleteButton = null;
    let restoreButton = null;
    if (this.props.value) {
      isPreviewHidden = false;
      let imageUrl;
      if (this.props.value.indexOf('.pdf') > 0) {
        imageUrl = '../../../../bahmni/images/pdfIcon.png';
      } else {
        imageUrl = `/document_images/${this.props.value.replace(/voided/g, '')}`;
      }
      preview = (<img src={imageUrl} />);
      deleteButton = this.displayDeleteButton();
      if (this.props.value.indexOf('voided') > 0) {
        restoreButton = this.displayRestoreButton();
      }
      this.addControlWithNotification(false);
    }
    const id = `file-browse-observation_${this.props.formFieldPath.split('/')[1]}`;
    const loading = (this.state.loading === true);
    return (
        <div className="obs-comment-section-wrap">
          <Spinner show={loading} />
          <input accept="application/pdf, image/*"
            className={classNames({ 'form-builder-error': this.state.hasErrors })}
            disabled={ !this.props.enabled }
            id={id}
            onChange={(e) => this.handleChange(e)}
            type="file"
          />
          <div className={classNames({ hidden: isPreviewHidden }, 'file')}>
            {preview}
            {deleteButton}
            {restoreButton}
          </div>
          <label className={classNames({ hidden: !isPreviewHidden }, 'placeholder')} htmlFor={id}>
            <i className="fa fa-cloud-upload"></i>
          </label>
        </div>
    );
  }
}


ComplexControl.propTypes = {
  addMore: PropTypes.bool,
  enabled: PropTypes.bool,
  formFieldPath: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onControlAdd: PropTypes.func.isRequired,
  patientUuid: PropTypes.string,
  showNotification: PropTypes.func.isRequired,
  validate: PropTypes.bool.isRequired,
  validations: PropTypes.array.isRequired,
  value: PropTypes.string,
};

ComplexControl.defaultProps = {
  enabled: true,
  addMore: false,
};

ComponentStore.registerComponent('complex', ComplexControl);