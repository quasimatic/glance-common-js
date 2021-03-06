import {firstResolved} from '../utils/promise-utils'
import {
    getTagNameFromClient,
    getValueFromClient,
    getAttributeFromClient,
    checkboxValueFromClient,
    getSelectTextFromClient,
    setCheckboxValueFromClient,
    getTextFromClient,
    triggerChange,
    getOptionFromText
} from '../utils/client';

function getCheckbox({element, glance}) {
    return glance.browser.execute(getAttributeFromClient, element, "type").then(function (attributeType) {
        if (attributeType.toLowerCase() === "checkbox") {
            return glance.browser.execute(checkboxValueFromClient, element, name);
        }

        return Promise.reject();
    });
}

function getInput({element, glance}) {
    return glance.browser.getValue(element);
}

export default  {
    transforms: {
        "text": {
            get: function (data) {
                var {selector, glance, target, element} = data;
                var elementPromise = element? Promise.resolve(element) : glance.element(selector);

                return elementPromise.then((element)=> {
                    return glance.browser.execute(getTagNameFromClient, element).then(function (tagName) {
                        switch (tagName.toLowerCase()) {
                            case "input":
                                return firstResolved([
                                    getCheckbox,
                                    getInput
                                ], strategy => strategy({...data, element}));

                            case "select":
                                return glance.browser.execute(getSelectTextFromClient, element);

                            default:
                                return glance.browser.execute(getTextFromClient, element);
                        }

                        return Promise.reject("No value to get");
                    });
                });
            },

            set: function (data) {
                let {selector, glance, target, value, element} = data
                var elementPromise = element? Promise.resolve(element) : glance.element(selector);

                return elementPromise.then((element)=> {
                    return glance.browser.execute(getTagNameFromClient, element).then(function (tagName) {
                        switch(tagName.toLowerCase()) {
                            case 'input':
                                return firstResolved([
                                    setCheckbox,
                                    setInput
                                ], strategy => strategy({...data, element, value})).then(result => {
                                    return glance.browser.execute(triggerChange, element).then(changed => result);
                                });

                            case "select":
                                return glance.browser.execute(getOptionFromText, element, value).then(result => {
                                    return glance.browser.click(result).then(() => glance.browser.execute(triggerChange, element).then(changed => result));
                                });
                        }

                        return Promise.reject("No value to set");
                    });
                });
            }
        }
    }
}