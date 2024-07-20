import * as $protobufjs from 'protobufjs/minimal';

const $Reader = $protobufjs.Reader;
const $Writer = $protobufjs.Writer;
const $util = $protobufjs.util;
const $root = $protobufjs.roots['default'] || ($protobufjs.roots['default'] = {});

const decoder = $protobuf.roots.default;

decoder.Caption = class Caption {
  constructor(properties = {}) {
    // Initialize default values
    this.deviceSpace = '';
    this.captionId = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    this.version = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    this.caption = '';
    this.languageId = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;

    // Assign properties if provided
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new Caption(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.deviceSpace != null && Object.hasOwnProperty.call(message, 'deviceSpace')) {
      writer.uint32(10).string(message.deviceSpace);
    }
    if (message.captionId != null && Object.hasOwnProperty.call(message, 'captionId')) {
      writer.uint32(16).int64(message.captionId);
    }
    if (message.version != null && Object.hasOwnProperty.call(message, 'version')) {
      writer.uint32(24).int64(message.version);
    }
    if (message.caption != null && Object.hasOwnProperty.call(message, 'caption')) {
      writer.uint32(50).string(message.caption);
    }
    if (message.languageId != null && Object.hasOwnProperty.call(message, 'languageId')) {
      writer.uint32(64).int64(message.languageId);
    }
    return writer;
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new Caption();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.deviceSpace = reader.string();
          break;
        case 2:
          message.captionId = reader.int64();
          break;
        case 3:
          message.version = reader.int64();
          break;
        case 6:
          message.caption = reader.string();
          break;
        case 8:
          message.languageId = reader.int64();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    const checks = {
      deviceSpace: $util.isString,
      captionId: (value) =>
        $util.isInteger(value) || (value && $util.isInteger(value.low) && $util.isInteger(value.high)),
      version: (value) =>
        $util.isInteger(value) || (value && $util.isInteger(value.low) && $util.isInteger(value.high)),
      caption: $util.isString,
      languageId: (value) =>
        $util.isInteger(value) || (value && $util.isInteger(value.low) && $util.isInteger(value.high))
    };

    for (const [key, check] of Object.entries(checks)) {
      if (message[key] != null && message.hasOwnProperty(key)) {
        if (!check(message[key])) {
          return `${key}: ${key.includes('Id') ? 'integer|Long' : 'string'} expected`;
        }
      }
    }
    return null;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.CaptionWrapper = class CaptionWrapper {
  constructor(properties = {}) {
    this.caption = null;
    this.unknown = '';
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new CaptionWrapper(properties);
  }

  static encode(message, writer = $protobufjs.Writer.create()) {
    if (message.caption != null && Object.hasOwnProperty.call(message, 'caption')) {
      Caption.encode(message.caption, writer.uint32(10).fork()).ldelim();
    }
    if (message.unknown != null && Object.hasOwnProperty.call(message, 'unknown')) {
      writer.uint32(18).string(message.unknown);
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $protobufjs.Reader)) {
      reader = $protobufjs.Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new CaptionWrapper();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.caption = Caption.decode(reader, reader.uint32());
          break;
        case 2:
          message.unknown = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $protobufjs.Reader)) {
      reader = new $protobufjs.Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.caption != null && message.hasOwnProperty('caption')) {
      const error = Caption.verify(message.caption);
      if (error) {
        return `caption.${error}`;
      }
    }
    if (message.unknown != null && message.hasOwnProperty('unknown')) {
      if (!$protobufjs.util.isString(message.unknown)) {
        return 'unknown: string expected';
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof CaptionWrapper) {
      return object;
    }
    const message = new CaptionWrapper();
    if (object.caption != null) {
      if (typeof object.caption !== 'object') {
        throw TypeError('.CaptionWrapper.caption: object expected');
      }
      message.caption = Caption.fromObject(object.caption);
    }
    if (object.unknown != null) {
      message.unknown = String(object.unknown);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.caption = null;
      object.unknown = '';
    }
    if (message.caption != null && message.hasOwnProperty('caption')) {
      object.caption = Caption.toObject(message.caption, options);
    }
    if (message.unknown != null && message.hasOwnProperty('unknown')) {
      object.unknown = message.unknown;
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.UserDetails = class UserDetails {
  constructor(properties = {}) {
    this.deviceId = '';
    this.fullName = '';
    this.profile = '';
    this.name = '';

    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new UserDetails(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.deviceId != null && Object.hasOwnProperty.call(message, 'deviceId')) {
      writer.uint32(10).string(message.deviceId);
    }
    if (message.fullName != null && Object.hasOwnProperty.call(message, 'fullName')) {
      writer.uint32(18).string(message.fullName);
    }
    if (message.profile != null && Object.hasOwnProperty.call(message, 'profile')) {
      writer.uint32(26).string(message.profile);
    }
    if (message.name != null && Object.hasOwnProperty.call(message, 'name')) {
      writer.uint32(234).string(message.name);
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new UserDetails();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.deviceId = reader.string();
          break;
        case 2:
          message.fullName = reader.string();
          break;
        case 3:
          message.profile = reader.string();
          break;
        case 29:
          message.name = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    const stringProperties = ['deviceId', 'fullName', 'profile', 'name'];
    for (const prop of stringProperties) {
      if (message[prop] != null && message.hasOwnProperty(prop)) {
        if (!$util.isString(message[prop])) {
          return `${prop}: string expected`;
        }
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof UserDetails) {
      return object;
    }
    const message = new UserDetails();
    const stringProperties = ['deviceId', 'fullName', 'profile', 'name'];
    for (const prop of stringProperties) {
      if (object[prop] != null) {
        message[prop] = String(object[prop]);
      }
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    const stringProperties = ['deviceId', 'fullName', 'profile', 'name'];
    if (options.defaults) {
      for (const prop of stringProperties) {
        object[prop] = '';
      }
    }
    for (const prop of stringProperties) {
      if (message[prop] != null && message.hasOwnProperty(prop)) {
        object[prop] = message[prop];
      }
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.UserDetailsWrapper = class UserDetailsWrapper {
  constructor(properties = {}) {
    this.userDetails = [];
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new UserDetailsWrapper(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.userDetails != null && message.userDetails.length) {
      for (const userDetail of message.userDetails) {
        UserDetails.encode(userDetail, writer.uint32(18).fork()).ldelim();
      }
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new UserDetailsWrapper();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (!(message.userDetails && message.userDetails.length)) {
            message.userDetails = [];
          }
          message.userDetails.push(UserDetails.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.userDetails != null && message.hasOwnProperty('userDetails')) {
      if (!Array.isArray(message.userDetails)) {
        return 'userDetails: array expected';
      }
      for (const userDetail of message.userDetails) {
        const error = UserDetails.verify(userDetail);
        if (error) {
          return `userDetails.${error}`;
        }
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof UserDetailsWrapper) {
      return object;
    }
    const message = new UserDetailsWrapper();
    if (object.userDetails) {
      if (!Array.isArray(object.userDetails)) {
        throw TypeError('.UserDetailsWrapper.userDetails: array expected');
      }
      message.userDetails = object.userDetails.map((userDetail) => {
        if (typeof userDetail !== 'object') {
          throw TypeError('.UserDetailsWrapper.userDetails: object expected');
        }
        return UserDetails.fromObject(userDetail);
      });
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.arrays || options.defaults) {
      object.userDetails = [];
    }
    if (message.userDetails && message.userDetails.length) {
      object.userDetails = message.userDetails.map((userDetail) => UserDetails.toObject(userDetail, options));
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.SpaceCollection = class SpaceCollection {
  constructor(properties = {}) {
    this.wrapper = null;
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new SpaceCollection(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.wrapper != null && Object.hasOwnProperty.call(message, 'wrapper')) {
      UserDetailsWrapper.encode(message.wrapper, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new SpaceCollection();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.wrapper = UserDetailsWrapper.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      const error = UserDetailsWrapper.verify(message.wrapper);
      if (error) {
        return `wrapper.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof SpaceCollection) {
      return object;
    }
    const message = new SpaceCollection();
    if (object.wrapper != null) {
      if (typeof object.wrapper !== 'object') {
        throw TypeError('.SpaceCollection.wrapper: object expected');
      }
      message.wrapper = UserDetailsWrapper.fromObject(object.wrapper);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.wrapper = null;
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      object.wrapper = UserDetailsWrapper.toObject(message.wrapper, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.MeetingSpaceCollectionResponse = class MeetingSpaceCollectionResponse {
  constructor(properties = {}) {
    this.spaces = null;
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new MeetingSpaceCollectionResponse(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.spaces != null && Object.hasOwnProperty.call(message, 'spaces')) {
      SpaceCollection.encode(message.spaces, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new MeetingSpaceCollectionResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.spaces = SpaceCollection.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.spaces != null && message.hasOwnProperty('spaces')) {
      const error = SpaceCollection.verify(message.spaces);
      if (error) {
        return `spaces.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof MeetingSpaceCollectionResponse) {
      return object;
    }
    const message = new MeetingSpaceCollectionResponse();
    if (object.spaces != null) {
      if (typeof object.spaces !== 'object') {
        throw TypeError('.MeetingSpaceCollectionResponse.spaces: object expected');
      }
      message.spaces = SpaceCollection.fromObject(object.spaces);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.spaces = null;
    }
    if (message.spaces != null && message.hasOwnProperty('spaces')) {
      object.spaces = SpaceCollection.toObject(message.spaces, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.ChatText = class ChatText {
  constructor(properties = {}) {
    this.text = '';
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new ChatText(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.text != null && Object.hasOwnProperty.call(message, 'text')) {
      writer.uint32(10).string(message.text);
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new ChatText();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.text = reader.string();
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.text != null && message.hasOwnProperty('text')) {
      if (!$util.isString(message.text)) {
        return 'text: string expected';
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof ChatText) {
      return object;
    }
    const message = new ChatText();
    if (object.text != null) {
      message.text = String(object.text);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.text = '';
    }
    if (message.text != null && message.hasOwnProperty('text')) {
      object.text = message.text;
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.ChatData = class ChatData {
  constructor(properties = {}) {
    this.messageId = '';
    this.deviceId = '';
    this.timestamp = $util.Long ? $util.Long.fromBits(0, 0, false) : 0;
    this.msg = null;

    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new ChatData(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.messageId != null && Object.hasOwnProperty.call(message, 'messageId')) {
      writer.uint32(10).string(message.messageId);
    }
    if (message.deviceId != null && Object.hasOwnProperty.call(message, 'deviceId')) {
      writer.uint32(18).string(message.deviceId);
    }
    if (message.timestamp != null && Object.hasOwnProperty.call(message, 'timestamp')) {
      writer.uint32(24).int64(message.timestamp);
    }
    if (message.msg != null && Object.hasOwnProperty.call(message, 'msg')) {
      ChatText.encode(message.msg, writer.uint32(42).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new ChatData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.messageId = reader.string();
          break;
        case 2:
          message.deviceId = reader.string();
          break;
        case 3:
          message.timestamp = reader.int64();
          break;
        case 5:
          message.msg = ChatText.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.messageId != null && message.hasOwnProperty('messageId')) {
      if (!$util.isString(message.messageId)) {
        return 'messageId: string expected';
      }
    }
    if (message.deviceId != null && message.hasOwnProperty('deviceId')) {
      if (!$util.isString(message.deviceId)) {
        return 'deviceId: string expected';
      }
    }
    if (message.timestamp != null && message.hasOwnProperty('timestamp')) {
      if (
        !(
          $util.isInteger(message.timestamp) ||
          (message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high))
        )
      ) {
        return 'timestamp: integer|Long expected';
      }
    }
    if (message.msg != null && message.hasOwnProperty('msg')) {
      const error = ChatText.verify(message.msg);
      if (error) {
        return `msg.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof ChatData) {
      return object;
    }
    const message = new ChatData();
    if (object.messageId != null) {
      message.messageId = String(object.messageId);
    }
    if (object.deviceId != null) {
      message.deviceId = String(object.deviceId);
    }
    if (object.timestamp != null) {
      if ($util.Long) {
        let long = $util.Long.fromValue(object.timestamp);
        message.timestamp = long.unsigned ? long.toNumber() : long;
      } else if (typeof object.timestamp === 'string') {
        message.timestamp = parseInt(object.timestamp, 10);
      } else if (typeof object.timestamp === 'number') {
        message.timestamp = object.timestamp;
      } else if (typeof object.timestamp === 'object') {
        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
      }
    }
    if (object.msg != null) {
      if (typeof object.msg !== 'object') {
        throw TypeError('.ChatData.msg: object expected');
      }
      message.msg = ChatText.fromObject(object.msg);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.messageId = '';
      object.deviceId = '';
      if ($util.Long) {
        let long = new $util.Long(0, 0, false);
        object.timestamp =
          options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : long;
      } else {
        object.timestamp = options.longs === String ? '0' : 0;
      }
      object.msg = null;
    }
    if (message.messageId != null && message.hasOwnProperty('messageId')) {
      object.messageId = message.messageId;
    }
    if (message.deviceId != null && message.hasOwnProperty('deviceId')) {
      object.deviceId = message.deviceId;
    }
    if (message.timestamp != null && message.hasOwnProperty('timestamp')) {
      if (typeof message.timestamp === 'number') {
        object.timestamp = options.longs === String ? String(message.timestamp) : message.timestamp;
      } else {
        object.timestamp =
          options.longs === String
            ? $util.Long.prototype.toString.call(message.timestamp)
            : options.longs === Number
              ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber()
              : message.timestamp;
      }
    }
    if (message.msg != null && message.hasOwnProperty('msg')) {
      object.msg = ChatText.toObject(message.msg, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.ChatWrapper = class ChatWrapper {
  constructor(properties = {}) {
    this.body = null;
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new ChatWrapper(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.body != null && Object.hasOwnProperty.call(message, 'body')) {
      ChatData.encode(message.body, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new ChatWrapper();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.body = ChatData.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.body != null && message.hasOwnProperty('body')) {
      const error = ChatData.verify(message.body);
      if (error) {
        return `body.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof ChatWrapper) {
      return object;
    }
    const message = new ChatWrapper();
    if (object.body != null) {
      if (typeof object.body !== 'object') {
        throw TypeError('.ChatWrapper.body: object expected');
      }
      message.body = ChatData.fromObject(object.body);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.body = null;
    }
    if (message.body != null && message.hasOwnProperty('body')) {
      object.body = ChatData.toObject(message.body, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.Wrapper3 = class Wrapper3 {
  constructor(properties = {}) {
    this.userDetails = [];
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new Wrapper3(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.userDetails != null && message.userDetails.length) {
      for (const v of message.userDetails) {
        UserDetails.encode(v, writer.uint32(18).fork()).ldelim();
      }
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new Wrapper3();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          if (!(message.userDetails && message.userDetails.length)) {
            message.userDetails = [];
          }
          message.userDetails.push(UserDetails.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.userDetails != null && message.hasOwnProperty('userDetails')) {
      if (!Array.isArray(message.userDetails)) {
        return 'userDetails: array expected';
      }
      for (let i = 0; i < message.userDetails.length; ++i) {
        const error = UserDetails.verify(message.userDetails[i]);
        if (error) {
          return `userDetails.${error}`;
        }
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof Wrapper3) {
      return object;
    }
    const message = new Wrapper3();
    if (object.userDetails) {
      if (!Array.isArray(object.userDetails)) {
        throw TypeError('.Wrapper3.userDetails: array expected');
      }
      message.userDetails = object.userDetails.map((item) => {
        if (typeof item !== 'object') {
          throw TypeError('.Wrapper3.userDetails: object expected');
        }
        return UserDetails.fromObject(item);
      });
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.arrays || options.defaults) {
      object.userDetails = [];
    }
    if (message.userDetails && message.userDetails.length) {
      object.userDetails = message.userDetails.map((v) => UserDetails.toObject(v, options));
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.Wrapper2 = class Wrapper2 {
  constructor(properties = {}) {
    this.wrapper = null;
    this.chat = [];
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new Wrapper2(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.wrapper != null && Object.hasOwnProperty.call(message, 'wrapper')) {
      Wrapper3.encode(message.wrapper, writer.uint32(10).fork()).ldelim();
    }
    if (message.chat != null && message.chat.length) {
      for (const v of message.chat) {
        ChatWrapper.encode(v, writer.uint32(34).fork()).ldelim();
      }
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new Wrapper2();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.wrapper = Wrapper3.decode(reader, reader.uint32());
          break;
        case 4:
          if (!(message.chat && message.chat.length)) {
            message.chat = [];
          }
          message.chat.push(ChatWrapper.decode(reader, reader.uint32()));
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      const error = Wrapper3.verify(message.wrapper);
      if (error) {
        return `wrapper.${error}`;
      }
    }
    if (message.chat != null && message.hasOwnProperty('chat')) {
      if (!Array.isArray(message.chat)) {
        return 'chat: array expected';
      }
      for (let i = 0; i < message.chat.length; ++i) {
        const error = ChatWrapper.verify(message.chat[i]);
        if (error) {
          return `chat.${error}`;
        }
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof Wrapper2) {
      return object;
    }
    const message = new Wrapper2();
    if (object.wrapper != null) {
      if (typeof object.wrapper !== 'object') {
        throw TypeError('.Wrapper2.wrapper: object expected');
      }
      message.wrapper = Wrapper3.fromObject(object.wrapper);
    }
    if (object.chat) {
      if (!Array.isArray(object.chat)) {
        throw TypeError('.Wrapper2.chat: array expected');
      }
      message.chat = object.chat.map((item) => {
        if (typeof item !== 'object') {
          throw TypeError('.Wrapper2.chat: object expected');
        }
        return ChatWrapper.fromObject(item);
      });
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.arrays || options.defaults) {
      object.chat = [];
    }
    if (options.defaults) {
      object.wrapper = null;
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      object.wrapper = Wrapper3.toObject(message.wrapper, options);
    }
    if (message.chat && message.chat.length) {
      object.chat = message.chat.map((v) => ChatWrapper.toObject(v, options));
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.Wrapper1 = class Wrapper1 {
  constructor(properties = {}) {
    this.wrapper = null;
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new Wrapper1(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.wrapper != null && Object.hasOwnProperty.call(message, 'wrapper')) {
      Wrapper2.encode(message.wrapper, writer.uint32(106).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new Wrapper1();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 13:
          message.wrapper = Wrapper2.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      const error = Wrapper2.verify(message.wrapper);
      if (error) {
        return `wrapper.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof Wrapper1) {
      return object;
    }
    const message = new Wrapper1();
    if (object.wrapper != null) {
      if (typeof object.wrapper !== 'object') {
        throw TypeError('.Wrapper1.wrapper: object expected');
      }
      message.wrapper = Wrapper2.fromObject(object.wrapper);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.wrapper = null;
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      object.wrapper = Wrapper2.toObject(message.wrapper, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.CollectionMessageBody = class CollectionMessageBody {
  constructor(properties = {}) {
    this.wrapper = null;
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new CollectionMessageBody(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.wrapper != null && Object.hasOwnProperty.call(message, 'wrapper')) {
      Wrapper1.encode(message.wrapper, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new CollectionMessageBody();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 2:
          message.wrapper = Wrapper1.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      const error = Wrapper1.verify(message.wrapper);
      if (error) {
        return `wrapper.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof CollectionMessageBody) {
      return object;
    }
    const message = new CollectionMessageBody();
    if (object.wrapper != null) {
      if (typeof object.wrapper !== 'object') {
        throw TypeError('.CollectionMessageBody.wrapper: object expected');
      }
      message.wrapper = Wrapper1.fromObject(object.wrapper);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.wrapper = null;
    }
    if (message.wrapper != null && message.hasOwnProperty('wrapper')) {
      object.wrapper = Wrapper1.toObject(message.wrapper, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

decoder.CollectionMessage = class CollectionMessage {
  constructor(properties = {}) {
    this.body = null;
    if (properties) {
      for (const [key, value] of Object.entries(properties)) {
        if (value != null) {
          this[key] = value;
        }
      }
    }
  }

  static create(properties) {
    return new CollectionMessage(properties);
  }

  static encode(message, writer = $Writer.create()) {
    if (message.body != null && Object.hasOwnProperty.call(message, 'body')) {
      CollectionMessageBody.encode(message.body, writer.uint32(10).fork()).ldelim();
    }
    return writer;
  }

  static encodeDelimited(message, writer) {
    return this.encode(message, writer).ldelim();
  }

  static decode(reader, length) {
    if (!(reader instanceof $Reader)) {
      reader = $Reader.create(reader);
    }
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = new CollectionMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          message.body = CollectionMessageBody.decode(reader, reader.uint32());
          break;
        default:
          reader.skipType(tag & 7);
          break;
      }
    }
    return message;
  }

  static decodeDelimited(reader) {
    if (!(reader instanceof $Reader)) {
      reader = new $Reader(reader);
    }
    return this.decode(reader, reader.uint32());
  }

  static verify(message) {
    if (typeof message !== 'object' || message === null) {
      return 'object expected';
    }
    if (message.body != null && message.hasOwnProperty('body')) {
      const error = CollectionMessageBody.verify(message.body);
      if (error) {
        return `body.${error}`;
      }
    }
    return null;
  }

  static fromObject(object) {
    if (object instanceof CollectionMessage) {
      return object;
    }
    const message = new CollectionMessage();
    if (object.body != null) {
      if (typeof object.body !== 'object') {
        throw TypeError('.CollectionMessage.body: object expected');
      }
      message.body = CollectionMessageBody.fromObject(object.body);
    }
    return message;
  }

  static toObject(message, options = {}) {
    const object = {};
    if (options.defaults) {
      object.body = null;
    }
    if (message.body != null && message.hasOwnProperty('body')) {
      object.body = CollectionMessageBody.toObject(message.body, options);
    }
    return object;
  }

  toJSON() {
    return this.constructor.toObject(this, $protobufjs.util.toJSONOptions);
  }
};

export default decoder;
