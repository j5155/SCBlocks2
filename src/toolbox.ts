/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/*
This toolbox contains nearly every single built-in block that Blockly offers,
in addition to the custom block 'add_text' this sample app adds.
You probably don't need every single block, and should consider either rewriting
your toolbox from scratch, or carefully choosing whether you need each block
listed here.
*/

// TODO styling

export let toolbox = {
    kind: 'categoryToolbox',
    contents: [
        {
            kind: 'category',
            name: 'Motors',
            categorystyle: 'motors_category',
            contents: []
        },
        {
            kind: 'category',
            name: 'Movement',
            categorystyle: 'movement_category',
            contents: []
        },
        {
            kind: 'category',
            name: 'Events',
            categorystyle: 'events_category',
            contents: []
        },
        {
            kind: 'category',
            name: 'Control',
            categorystyle: 'control_category',
            contents: [
                // TODO wait seconds
                {
                    kind: 'block',
                    type: 'controls_repeat_ext',
                    inputs: {
                        TIMES: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 10,
                                },
                            },
                        },
                    },
                },
                // TODO FOREVER
                {
                    kind: 'block',
                    type: 'controls_if', // TODO make normal if statement not mutator
                },
                {
                    kind: 'block',
                    type: 'controls_ifelse',
                },
                // TODO WAIT UNTIL
                {
                    kind: 'block',
                    type: 'controls_whileUntil', // lets you pick between repeat while and repeat until, which is a change, but I think a good idea
                },
                {
                    kind: 'block',
                    type: 'controls_flow_statements', // different but more useful then scratch equivalent
                },
            ]
        },
        {
            kind: 'category',
            name: 'Sensing',
            categorystyle: 'sensing_category',
            contents: []
        },
        {
            kind: 'category',
            name: 'Operators',
            categorystyle: 'operators_category',
            contents: [
                {
                    kind: 'block',
                    type: 'math_arithmetic', // TODO split from selector into options
                    inputs: {
                        A: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 1,
                                },
                            },
                        },
                        B: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 1,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_random_int',
                    inputs: {
                        FROM: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 1,
                                },
                            },
                        },
                        TO: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 100,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_random_float',
                },
                {
                    kind: 'block',
                    type: 'logic_compare',
                },
                {
                    kind: 'block',
                    type: 'logic_operation',
                },
                {
                    kind: 'block',
                    type: 'logic_negate',
                },

                {
                    kind: 'block',
                    type: 'text', // TODO make not weird, ideally remove
                },
                {
                    kind: 'block',
                    type: 'text_join', // TODO make not weird
                },
                {
                    kind: 'block',
                    type: 'text_length',
                    inputs: {
                        VALUE: {
                            shadow: {
                                type: 'text',
                                fields: {
                                    TEXT: 'abc',
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'text_indexOf', // TODO make not cooked, should we keep this? scratch has no equivalent
                    inputs: {
                        VALUE: {
                            block: {
                                type: 'variables_get',
                            },
                        },
                        FIND: {
                            shadow: {
                                type: 'text',
                                fields: {
                                    TEXT: 'abc',
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'text_charAt', // TODO make not cooked
                    inputs: {
                        VALUE: {
                            block: {
                                type: 'variables_get',
                            },
                        },
                    },
                },
                // TODO "text contains" boolean
                {
                    kind: 'block',
                    type: 'math_single',
                    inputs: {
                        NUM: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 9,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_trig',
                    inputs: {
                        NUM: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 45,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_constant',
                },
                {
                    kind: 'block',
                    type: 'math_number_property',
                    inputs: {
                        NUMBER_TO_CHECK: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 0,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_round',
                    fields: {
                        OP: 'ROUND',
                    },
                    inputs: {
                        NUM: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 3.1,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_on_list',
                    fields: {
                        OP: 'SUM',
                    },
                },
                {
                    kind: 'block',
                    type: 'math_modulo',
                    inputs: {
                        DIVIDEND: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 64,
                                },
                            },
                        },
                        DIVISOR: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 10,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_constrain',
                    inputs: {
                        VALUE: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 50,
                                },
                            },
                        },
                        LOW: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 1,
                                },
                            },
                        },
                        HIGH: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 100,
                                },
                            },
                        },
                    },
                },
                {
                    kind: 'block',
                    type: 'math_atan2',
                    inputs: {
                        X: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 1,
                                },
                            },
                        },
                        Y: {
                            shadow: {
                                type: 'math_number',
                                fields: {
                                    NUM: 1,
                                },
                            },
                        },
                    },
                },
            ]
        },
        {
            kind: 'category',
            name: 'Variables',
            categorystyle: 'variables_category',
            custom: 'VARIABLE' // TODO lists, the builtin lists blocks are cooked
        },
        {
            kind: 'category',
            name: 'My Blocks',
            categorystyle: 'myblocks_category',
            custom: 'PROCEDURE' // TODO proper input picking GUI, change "to" to "define"
        }
    ]
}
