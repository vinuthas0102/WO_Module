import React from 'react';
import { DynamicFieldProps } from '../../types';
import { AlertCircle } from 'lucide-react';

const DynamicTextField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={config.placeholder}
        disabled={disabled}
        required={config.is_required}
        minLength={config.validation_rules.minLength}
        maxLength={config.validation_rules.maxLength}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicNumberField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value ? Number(e.target.value) : null);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <input
        type="number"
        value={value || ''}
        onChange={handleChange}
        placeholder={config.placeholder}
        disabled={disabled}
        required={config.is_required}
        min={config.validation_rules.min}
        max={config.validation_rules.max}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicTextAreaField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <textarea
        value={value || ''}
        onChange={handleChange}
        placeholder={config.placeholder}
        disabled={disabled}
        required={config.is_required}
        minLength={config.validation_rules.minLength}
        maxLength={config.validation_rules.maxLength}
        rows={4}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicDateField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const getMinDate = () => {
    if (config.validation_rules.minDate === 'today') {
      return new Date().toISOString().split('T')[0];
    }
    return config.validation_rules.minDate;
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <input
        type="date"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        required={config.is_required}
        min={getMinDate()}
        max={config.validation_rules.maxDate}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicDropdownField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled, options }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        required={config.is_required}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      >
        <option value="">{config.placeholder || `Select ${config.label}`}</option>
        {options?.map(option => (
          <option key={option.id} value={option.option_value}>
            {option.option_label}
          </option>
        ))}
      </select>
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicMultiSelectField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled, options }) => {
  const selectedValues = Array.isArray(value) ? value : [];

  const handleChange = (optionValue: string) => {
    const newValues = selectedValues.includes(optionValue)
      ? selectedValues.filter(v => v !== optionValue)
      : [...selectedValues, optionValue];
    onChange(newValues);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <div className={`border rounded-md p-2 max-h-40 overflow-y-auto ${error ? 'border-red-500' : 'border-gray-300'} ${disabled ? 'bg-gray-100' : ''}`}>
        {options?.map(option => (
          <label key={option.id} className="flex items-center space-x-2 py-1 cursor-pointer hover:bg-gray-50 px-2 rounded">
            <input
              type="checkbox"
              checked={selectedValues.includes(option.option_value)}
              onChange={() => handleChange(option.option_value)}
              disabled={disabled}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">{option.option_label}</span>
          </label>
        ))}
      </div>
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicCheckboxField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="w-full">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value || false}
          onChange={handleChange}
          disabled={disabled}
          className="rounded text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">
          {config.label} {config.is_required && <span className="text-red-600">*</span>}
        </span>
      </label>
      {config.help_text && <p className="text-xs text-gray-500 mt-1 ml-6">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 ml-6 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

const DynamicAlphanumericField: React.FC<DynamicFieldProps> = ({ config, value, onChange, error, disabled }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const pattern = config.validation_rules.pattern || '^[a-zA-Z0-9]+$';
    const regex = new RegExp(pattern);

    if (inputValue === '' || regex.test(inputValue)) {
      onChange(inputValue);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {config.label} {config.is_required && <span className="text-red-600">*</span>}
      </label>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={config.placeholder}
        disabled={disabled}
        required={config.is_required}
        minLength={config.validation_rules.minLength}
        maxLength={config.validation_rules.maxLength}
        className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
      />
      {config.help_text && <p className="text-xs text-gray-500 mt-1">{config.help_text}</p>}
      {error && (
        <div className="flex items-center space-x-1 mt-1 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export const DynamicField: React.FC<DynamicFieldProps> = (props) => {
  const { config } = props;

  switch (config.field_type) {
    case 'text':
      return <DynamicTextField {...props} />;
    case 'number':
      return <DynamicNumberField {...props} />;
    case 'textarea':
      return <DynamicTextAreaField {...props} />;
    case 'date':
      return <DynamicDateField {...props} />;
    case 'dropdown':
      return <DynamicDropdownField {...props} />;
    case 'multi_select':
      return <DynamicMultiSelectField {...props} />;
    case 'checkbox':
      return <DynamicCheckboxField {...props} />;
    case 'alphanumeric':
      return <DynamicAlphanumericField {...props} />;
    case 'file_upload':
      return <div className="text-gray-500 text-sm">File upload field (use existing attachment component)</div>;
    default:
      return <div className="text-red-500 text-sm">Unknown field type: {config.field_type}</div>;
  }
};

export default DynamicField;
