import * as Blockly from 'blockly';

/**
 * Project-level motor (device) registry.
 *
 * A "motor" used to be a Blockly variable that had to be registered by hand with
 * an `sc_a301_motor` block inside each opmode's setup hat. Motors are now a
 * single project-level list managed through the UI (see App.vue's Motors modal).
 * Blocks reference a motor by its stable `id` via the custom `field_device`
 * dropdown; code generation and automatic registration resolve `id -> name/bus/
 * deviceId` from this registry (see generators/python.ts).
 *
 * This module is intentionally framework-agnostic (no Vue) so the Python
 * generator and the smoke test can read it directly.
 */

export type Device = {
  id: string;
  name: string;
  bus: number;
  deviceId: number;
};

const MISSING_DEVICE_LABEL = '(missing motor)';
const EMPTY_DEVICE_LABEL = '(add a motor)';

let devices: Device[] = [];
let nextId = 1;

type DeviceListener = () => void;
const listeners = new Set<DeviceListener>();

const notify = () => {
  for (const listener of listeners) listener();
};

/** Subscribe to any change in the registry. Returns an unsubscribe function. */
export const onDevicesChanged = (listener: DeviceListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getDevices = (): readonly Device[] => devices;

export const getDevice = (id: string | null | undefined): Device | undefined =>
  id ? devices.find((device) => device.id === id) : undefined;

const newDeviceId = () => `device-${Date.now().toString(36)}-${nextId++}`;

/** A default name that doesn't collide with an existing motor. */
const uniqueName = (base: string) => {
  const taken = new Set(devices.map((device) => device.name));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) {
    const candidate = `${base}_${i}`;
    if (!taken.has(candidate)) return candidate;
  }
};

export const addDevice = (partial: Partial<Device> = {}): Device => {
  const device: Device = {
    id: partial.id ?? newDeviceId(),
    name: uniqueName(partial.name?.trim() || `motor_${devices.length + 1}`),
    bus: partial.bus ?? 0,
    deviceId: partial.deviceId ?? 0,
  };
  devices = [...devices, device];
  notify();
  return device;
};

export const updateDevice = (id: string, patch: Partial<Device>) => {
  devices = devices.map((device) =>
    device.id === id ? {...device, ...patch, id: device.id} : device,
  );
  notify();
};

export const removeDevice = (id: string) => {
  devices = devices.filter((device) => device.id !== id);
  notify();
};

/** Replaces the whole registry (used when loading a saved project). */
export const setDevices = (list: Device[]) => {
  devices = list.map((device) => ({
    id: device.id ?? newDeviceId(),
    name: device.name ?? 'motor',
    bus: Number(device.bus) || 0,
    deviceId: Number(device.deviceId) || 0,
  }));
  notify();
};

// --- Custom field ----------------------------------------------------------

type DropdownOption = [string, string];

const deviceOptions = (currentValue?: string): DropdownOption[] => {
  const options: DropdownOption[] = devices.map((device) => [
    device.name,
    device.id,
  ]);
  if (!options.length) return [[EMPTY_DEVICE_LABEL, '']];
  // Keep a dangling reference (a deleted motor) visible instead of silently
  // repointing the block at whichever motor happens to be first.
  if (currentValue && !devices.some((device) => device.id === currentValue)) {
    options.push([MISSING_DEVICE_LABEL, currentValue]);
  }
  return options;
};

// Invoked by Blockly as `this.menuGenerator_()`, so `this` is the field. Must be
// a plain function (not an arrow) — FieldDropdown's constructor calls it during
// super(), before the derived instance's `this` is initialized.
function deviceMenuGenerator(this: Blockly.FieldDropdown): DropdownOption[] {
  const current = this.getValue?.();
  return deviceOptions(typeof current === 'string' ? current : undefined);
}

/**
 * Dropdown field that lists the registered motors by name. The stored value is
 * the motor's stable id, so renaming a motor doesn't break existing blocks.
 */
export class FieldDevice extends Blockly.FieldDropdown {
  constructor() {
    super(deviceMenuGenerator);
  }

  static fromJson(): FieldDevice {
    return new FieldDevice();
  }

  // Accept any value (including a deleted motor's id) rather than snapping to
  // the first option; deviceOptions() surfaces it as "(missing motor)".
  protected override doClassValidation_(newValue?: string): string | null {
    return newValue == null ? null : String(newValue);
  }
}

export const DEVICE_FIELD_TYPE = 'field_device';

let fieldRegistered = false;
export const registerDeviceField = () => {
  if (fieldRegistered) return;
  Blockly.fieldRegistry.register(DEVICE_FIELD_TYPE, FieldDevice);
  fieldRegistered = true;
};

/**
 * Force every device dropdown in the workspace to re-render so a renamed motor's
 * label updates immediately.
 */
export const refreshDeviceFields = (workspace: Blockly.Workspace) => {
  for (const block of workspace.getAllBlocks(false)) {
    const field = block.getField('DEVICE');
    if (field instanceof FieldDevice) {
      field.forceRerender();
    }
  }
};

/** Field definition helper for block JSON. */
export const deviceField = () => ({
  type: DEVICE_FIELD_TYPE,
  name: 'DEVICE',
});
