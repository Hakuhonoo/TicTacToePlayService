const _ = require('lodash');

module.exports = {
    checkFields: (fields, requiredFields = [], optionalField = []) => {
        const validKeys = _.pick(fields, requiredFields);
        if (_.size(validKeys) !== requiredFields.length)
            return null;

        if (!_.isEmpty(_.difference(Object.keys(fields), [...requiredFields, ...optionalField])))
            return null;

        return fields;
    }
};