import React, { Component, PropTypes } from 'react';
import classNames from 'classnames';
import { Label } from 'components/Label.jsx';
import ComponentStore from 'src/helpers/componentStore';
import find from 'lodash/find';
import { Comment } from 'components/Comment.jsx';
import { getValidations } from 'src/helpers/controlsHelper';
import { UnSupportedComponent } from 'components/UnSupportedComponent.jsx';
import isEmpty from 'lodash/isEmpty';
import addMoreDecorator from './AddMoreDecorator';

export class ObsControl extends addMoreDecorator(Component) {

  constructor(props) {
    super(props);
    this.state = { };
    this.onChange = this.onChange.bind(this);
    this.onCommentChange = this.onCommentChange.bind(this);
    this.onAddControl = this.onAddControl.bind(this);
    this.onRemoveControl = this.onRemoveControl.bind(this);
    this.onEventTrigger = this.onEventTrigger.bind(this);
  }

  onChange(value, errors, onActionDone) {
    this.props.onValueChanged(
      this.props.formFieldPath,
      { value, comment: this.props.value.comment },
      errors,
      onActionDone);
  }

  onCommentChange(comment) {
    this.props.onValueChanged(
      this.props.formFieldPath,
      { value: this.props.value.value, comment },
      undefined
    );
  }

  displayObsControl(registeredComponent) {
    const { enabled, metadata, metadata: { concept }, validate } = this.props;
    const options = metadata.options || concept.answers;
    const validations = getValidations(metadata.properties, concept.properties);
    return React.createElement(registeredComponent, {
      enabled,
      properties: metadata.properties,
      options,
      onChange: this.onChange,
      onEventTrigger: this.onEventTrigger,
      validate,
      validations,
      value: this.props.value.value,
      ...this._numericContext(metadata),
    });
  }

  _numericContext(metadata) {
    return {
      hiNormal: metadata.hiNormal,
      lowNormal: metadata.lowNormal,
      hiAbsolute: metadata.hiAbsolute,
      lowAbsolute: metadata.lowAbsolute,
    };
  }

  displayLabel() {
    const { properties, label } = this.props.metadata;
    const hideLabel = find(properties, (value, key) => (key === 'hideLabel' && value));
    if (!hideLabel) {
      return (
            <Label metadata={label} />
      );
    }
    return null;
  }

  markMandatory() {
    const { properties } = this.props.metadata;
    const isMandatory = find(properties, (value, key) => (key === 'mandatory' && value));
    if (isMandatory) {
      return <span className="form-builder-asterisk">*</span>;
    }
    return null;
  }

  showHelperText() {
    const { concept } = this.props.metadata;
    const showHintButton = this.state && this.state.showHintButton;
    const description = concept.description && !isEmpty(concept.description) ?
      concept.description[0].display : undefined;
    if (description) {
      return (
        <div className={classNames('form-builder-tooltip-wrap fr',
           { active: showHintButton === true }) }>
          <i className="fa fa-question-circle form-builder-tooltip-trigger"
            onClick={() => this.setState({ showHintButton: !showHintButton })}
          />
          <p className="form-builder-tooltip-description">
            <i className="fa fa-caret-down"></i>
            <span className="details hint">{description}</span>
          </p>
        </div>
      );
    }
    return null;
  }

  showComment() {
    const { metadata: { properties } } = this.props;
    const isAddCommentsEnabled = find(properties, (value, key) => (key === 'notes' && value));
    if (isAddCommentsEnabled) {
      const comment = this.props.value.comment;
      return (
        <Comment comment={comment} onCommentChange={this.onCommentChange} />
      );
    }
    return null;
  }


  render() {
    const { concept } = this.props.metadata;
    const registeredComponent = ComponentStore.getRegisteredComponent(concept.datatype);
    if (registeredComponent) {
      return (
        <div className="form-field-wrap clearfix">
          <div className="label-wrap fl">
            {this.displayLabel()}
            {this.markMandatory()}
            {this.showHelperText()}
          </div>
          {this.displayObsControl(registeredComponent)}
          {this.showAddMore()}
          {this.showComment()}
        </div>
      );
    }
    return (
        <div>
          <UnSupportedComponent
            message={ `The component with concept datatype ${concept.datatype} is not supported` }
          />
        </div>
    );
  }
}

ObsControl.propTypes = {
  children: PropTypes.array,
  collapse: PropTypes.bool,
  enabled: PropTypes.bool,
  metadata: PropTypes.shape({
    concept: PropTypes.object.isRequired,
    displayType: PropTypes.string,
    id: PropTypes.string.isRequired,
    label: PropTypes.shape({
      type: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }).isRequired,
    properties: PropTypes.object,
    type: PropTypes.string.isRequired,
  }),
  onControlAdd: PropTypes.func,
  onControlRemove: PropTypes.func,
  onValueChanged: PropTypes.func.isRequired,
  showAddMore: PropTypes.bool.isRequired,
  showRemove: PropTypes.bool.isRequired,
  validate: PropTypes.bool.isRequired,
  value: PropTypes.object.isRequired,
};

ObsControl.defaultProps = {
  showAddMore: false,
  showRemove: false,
};

ComponentStore.registerComponent('obsControl', ObsControl);
