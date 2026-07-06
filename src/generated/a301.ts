export type A301ArgData = {
  name: string;
  type: string;
  defaultValue: string;
};

export type A301MethodData = {
  id: string;
  name: string;
  returnType: string;
  args: A301ArgData[];
  isCommon: boolean;
  tooltip: string;
};

export const A301_CLASS_NAME = 'rev.A301';
export const A301_MODULE_NAME = 'rev';

// Generated from RobotPy metadata for rev.A301. Regenerate with:
// npm run generate:a301 -- [path/to/robotpy_data.json]
export const A301_INSTANCE_METHODS: A301MethodData[] = [
  {id:"clearFaults",name:"clearFaults",returnType:"rev.REVLibError",args:[],isCommon:false,tooltip:"Clears all sticky faults."},
  {id:"disable",name:"disable",returnType:"None",args:[],isCommon:false,tooltip:"Common interface for disabling a motor."},
  {id:"getAbsoluteEncoderPosition",name:"getAbsoluteEncoderPosition",returnType:"rev.Signal_double",args:[],isCommon:true,tooltip:"Get the absolute position of the motor. This returns the native units"},
  {id:"getAppliedOutput",name:"getAppliedOutput",returnType:"rev.Signal_double",args:[],isCommon:false,tooltip:"Returns the A301's output duty cycle."},
  {id:"getBusId",name:"getBusId",returnType:"int",args:[],isCommon:false,tooltip:"Get the configured CAN Bus ID of the FIRST A301."},
  {id:"getBusVoltage",name:"getBusVoltage",returnType:"rev.Signal_double",args:[],isCommon:false,tooltip:"Returns the voltage fed into the A301."},
  {id:"getDeviceId",name:"getDeviceId",returnType:"int",args:[],isCommon:false,tooltip:"Get the configured Device ID of the FIRST A301."},
  {id:"getEncoderVelocity",name:"getEncoderVelocity",returnType:"rev.Signal_double",args:[],isCommon:true,tooltip:"Get the velocity of the motor. This returns the native units"},
  {id:"getFaults",name:"getFaults",returnType:"rev.Signal_A301Faults",args:[],isCommon:false,tooltip:"Get the active faults that are currently present on the A301. Faults"},
  {id:"getFirmwareString",name:"getFirmwareString",returnType:"str",args:[],isCommon:false,tooltip:"Get the firmware version of the FIRST A301 as a string."},
  {id:"getFirmwareVersion",name:"getFirmwareVersion",returnType:"int",args:[],isCommon:false,tooltip:"Get the firmware version of the FIRST A301."},
  {id:"getFirmwareVersion_tuple_int_bool",name:"getFirmwareVersion",returnType:"tuple[int, bool]",args:[],isCommon:false,tooltip:""},
  {id:"getInverted",name:"getInverted",returnType:"bool",args:[],isCommon:false,tooltip:"Common interface for getting the inversion state of the motor controller."},
  {id:"getMotorCurrent",name:"getMotorCurrent",returnType:"rev.Signal_double",args:[],isCommon:false,tooltip:"Returns A301's motor current in Amps."},
  {id:"getMotorTemperature",name:"getMotorTemperature",returnType:"rev.Signal_double",args:[],isCommon:false,tooltip:"Returns the motor temperature in Celsius."},
  {id:"getRelativeEncoderPosition",name:"getRelativeEncoderPosition",returnType:"rev.Signal_double",args:[],isCommon:true,tooltip:"Get the position of the motor. This returns the native units"},
  {id:"getStickyFaults",name:"getStickyFaults",returnType:"rev.Signal_A301Faults",args:[],isCommon:false,tooltip:"Get the sticky faults that were present on the A301 at one point"},
  {id:"getStickyWarnings",name:"getStickyWarnings",returnType:"rev.Signal_A301Warnings",args:[],isCommon:false,tooltip:"Get the sticky warnings that were present on the A301 at one point"},
  {id:"getThrottle",name:"getThrottle",returnType:"float",args:[],isCommon:true,tooltip:"Gets the throttle of the motor controller."},
  {id:"getWarnings",name:"getWarnings",returnType:"rev.Signal_A301Warnings",args:[],isCommon:false,tooltip:"Get the active warnings that are currently present on the A301."},
  {id:"hasActiveFault",name:"hasActiveFault",returnType:"rev.Signal_bool",args:[],isCommon:false,tooltip:""},
  {id:"hasActiveWarning",name:"hasActiveWarning",returnType:"rev.Signal_bool",args:[],isCommon:false,tooltip:"Get whether the A301 has one or more active warnings."},
  {id:"hasStickyFault",name:"hasStickyFault",returnType:"rev.Signal_bool",args:[],isCommon:false,tooltip:"Get whether the A301 has one or more sticky faults."},
  {id:"hasStickyWarning",name:"hasStickyWarning",returnType:"rev.Signal_bool",args:[],isCommon:false,tooltip:"Get whether the A301 has one or more sticky warnings."},
  {id:"setAbsolutePosition",name:"setAbsolutePosition",returnType:"rev.REVLibError",args:[{name:"absPosition",type:"float",defaultValue:""},{name:"isContinuous",type:"bool",defaultValue:""}],isCommon:true,tooltip:"Sets the absolute position of the A301 with optional continuous rotation."},
  {id:"setCurrent",name:"setCurrent",returnType:"rev.REVLibError",args:[{name:"current",type:"float",defaultValue:""}],isCommon:false,tooltip:"Sets the motor current of the A301."},
  {id:"setInverted",name:"setInverted",returnType:"None",args:[{name:"isInverted",type:"bool",defaultValue:""}],isCommon:true,tooltip:"Common interface for setting the inversion state of the motor controller."},
  {id:"setPosition",name:"setPosition",returnType:"rev.REVLibError",args:[{name:"position",type:"float",defaultValue:""}],isCommon:true,tooltip:"Sets the relative position of the A301."},
  {id:"setRelativeEncoderPosition",name:"setRelativeEncoderPosition",returnType:"rev.REVLibError",args:[{name:"position",type:"float",defaultValue:""}],isCommon:true,tooltip:"Set the position of the relative encoder."},
  {id:"setThrottle",name:"setThrottle",returnType:"None",args:[{name:"throttle",type:"float",defaultValue:""}],isCommon:true,tooltip:"Sets the throttle of the motor controller."},
  {id:"setVelocity",name:"setVelocity",returnType:"rev.REVLibError",args:[{name:"velocity",type:"float",defaultValue:""}],isCommon:true,tooltip:"Sets the velocity of the A301."},
  {id:"setVoltage",name:"setVoltage",returnType:"None",args:[{name:"output",type:"wpimath.units.volts",defaultValue:""}],isCommon:false,tooltip:"Sets the voltage output of the SpeedController. The behavior of"},
];

export const getA301Method = (id: string) =>
  A301_INSTANCE_METHODS.find((method) => method.id === id) ||
  A301_INSTANCE_METHODS[0];

export const labelForA301Method = (method: A301MethodData) => {
  const argLabel = method.args.map((arg) => arg.name).join(', ');
  const commonPrefix = method.isCommon ? 'Common: ' : '';
  return `${commonPrefix}${method.name}(${argLabel}) -> ${method.returnType}`;
};

export const a301MethodOptions = (methods = A301_INSTANCE_METHODS) =>
  methods.map((method) => [labelForA301Method(method), method.id]);

export const A301_VALUE_METHODS = A301_INSTANCE_METHODS.filter(
  (method) => method.returnType !== 'None',
);
