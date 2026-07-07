/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Create a custom block called 'add_text' that adds
// text to the output div on the sample app.
// This is just an example and you should replace this with your
// own custom blocks.
const addText = {
  type: 'add_text',
  message0: 'Add text %1',
  args0: [
    {
      type: 'input_value',
      name: 'TEXT',
      check: 'String',
    },
  ],
  previousStatement: null,
  nextStatement: null,
  style: 'looks_blocks',
  tooltip: '',
  helpUrl: '',
};

const spinMotorForDuration = {
  type: 'spin_motor_for_duration',
  message0: 'Spin motor %1 for %2 %3',
  args0: [
    {
      type: 'field_dropdown', // motor id
      name: 'MOTOR_ID',
      options: [
        [ "my a301", "MY_A301"]
      ]
    },
    {
      type: 'field_number', // duration
      name: 'DURATION',
      value: 0,
    },
    {
      type: 'field_dropdown',
      name: "DURATION_UNIT",
      options: [
        [ "seconds", "S" ],
        [ "rotations", "R"]
      ]
    }
  ],
  previousStatement: null,
  nextStatement: null,
  style: 'motors_blocks',
  tooltip: '',
  helpUrl: '',
  "extensions": ["get_motor_ids"]
}

const registerMotorByPort = {
  type: 'register_motor',
  message0: 'Assign port %1 to motor %2',
  args0: [
    {
      type: 'field_number', // duration
      name: 'PORT',
      value: 0,
    },
    {
      type: 'field_input',
      name: "MOTOR_NAME",
      text: "My A301"
    }
  ],
  previousStatement: null,
  nextStatement: null,
  style: 'motors_blocks',
  tooltip: '',
  helpUrl: '',
}

// Create the block definitions for the JSON-only blocks.
// This does not register their definitions with Blockly.
// This file has no side effects!
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  addText,
  spinMotorForDuration
]);

// the set of id: name for all motors
export let motor_names: Record<number, string> = {0: "my a301" };

Blockly.Extensions.register('get_motor_ids', function () {
  this.getField('MOTOR_ID').setOptions(function () {
    var options = [];
    for (var i = 0; i < 20; i++) {
      if (motor_names[i]) {
        options.push([motor_names[i], i.toString()])
      }
    }
    console.log(options)
    return options
  });
});

// TODO: fix and standardize terminology like port and id, make ids accurate to sc software
Blockly.Blocks['register_motor'] = {
  init: function() {
    this.jsonInit(registerMotorByPort);
  },

  // every time the block is updated, update the corresponding record entry
  onchange: function () {
    var port = this.getField("PORT").getValue();
    var name = this.getField("MOTOR_NAME").getValue();
    console.log(port, name, motor_names);
    motor_names[port] = name;
  }
}