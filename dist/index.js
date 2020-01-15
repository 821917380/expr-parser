'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ESCAPE = {
  'n': '\n',
  'f': '\f',
  'r': '\r',
  't': '\t',
  'v': '\v'
};

var CONSTANTS = {
  'null': function _null(data) {
    return null;
  },
  'true': function _true(data) {
    return true;
  },
  'false': function _false(data) {
    return false;
  },
  'undefined': function (_undefined) {
    function undefined(_x) {
      return _undefined.apply(this, arguments);
    }

    undefined.toString = function () {
      return _undefined.toString();
    };

    return undefined;
  }(function (data) {
    return undefined;
  })
};

var OPERATORS = {
  '+': function _(data, a, b) {
    return a(data) + b(data);
  },
  '-': function _(data, a, b) {
    return a(data) - b(data);
  },
  '*': function _(data, a, b) {
    return a(data) * b(data);
  },
  '/': function _(data, a, b) {
    return a(data) / b(data);
  },
  '%': function _(data, a, b) {
    return a(data) % b(data);
  },
  '===': function _(data, a, b) {
    return a(data) === b(data);
  },
  '!==': function _(data, a, b) {
    return a(data) !== b(data);
  },
  '==': function _(data, a, b) {
    return a(data) == b(data);
  },
  '!=': function _(data, a, b) {
    return a(data) != b(data);
  },
  '<': function _(data, a, b) {
    return a(data) < b(data);
  },
  '>': function _(data, a, b) {
    return a(data) > b(data);
  },
  '<=': function _(data, a, b) {
    return a(data) <= b(data);
  },
  '>=': function _(data, a, b) {
    return a(data) >= b(data);
  },
  '&&': function _(data, a, b) {
    return a(data) && b(data);
  },
  '||': function _(data, a, b) {
    return a(data) || b(data);
  },
  '!': function _(data, a) {
    return !a(data);
  }
};

function isNumber(char) {
  return char >= '0' && char <= '9' && typeof char === 'string';
}

function isExpOperator(char) {
  return char === '-' || char === '+' || isNumber(char);
}

function isIdent(char) {
  return char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z' || char === '_' || char === '$';
}

var Expression = function () {
  function Expression(content) {
    _classCallCheck(this, Expression);

    if (!content) throw new Error('invalid expression');

    this.content = content;
  }

  _createClass(Expression, [{
    key: 'lex',
    value: function lex() {
      var content = this.content;
      var length = content.length;
      var index = 0;
      var tokens = [];

      while (index < length) {
        var char = content.charAt(index);

        if (char === '"' || char === '\'') {
          // 字符串
          var start = ++index;
          var _escape = false;
          var value = '';
          var token = void 0;

          while (index < length) {
            var c = content.charAt(index);

            if (_escape) {
              if (c === 'u') {
                var hex = content.substring(index + 1, index + 5);
                if (!hex.match(/[\da-f]{4}/i)) {
                  throw new Error('invalid expression: ' + content + ', invalid unicode escape [\\u' + hex + ']');
                }
                index += 4;
                value += String.fromCharCode(parseInt(hex, 16));
              } else {
                var rep = ESCAPE[c];
                value = value + (rep || c);
              }
              _escape = false;
            } else if (c === '\\') {
              _escape = true;
            } else if (c === char) {
              index++;
              token = {
                index: start,
                constant: true,
                text: char + value + char,
                value: value
              };
              break;
            } else {
              value += c;
            }

            index++;
          }

          if (!token) {
            throw new Error('invalid expression: ' + content);
          } else {
            tokens.push(token);
          }
        } else if (isNumber(char) || char === '.' && isNumber(content.charAt(index + 1))) {
          // 数字
          var _start = index;
          var _value = '';

          while (index < length) {
            var _c = content.charAt(index).toLowerCase();
            if (_c === '.' || isNumber(_c)) {
              _value += _c;
            } else {
              var c2 = content.charAt(index + 1);
              if (_c === 'e' && isExpOperator(c2)) {
                _value += _c;
              } else if (isExpOperator(_c) && c2 && isNumber(c2) && _value.charAt(_value.length - 1) === 'e') {
                _value += _c;
              } else if (isExpOperator(_c) && (!c2 || !isNumber(c2)) && _value.charAt(_value.length - 1) == 'e') {
                throw new Error('invalid expression: ' + content);
              } else {
                break;
              }
            }
            index++;
          }

          tokens.push({
            index: _start,
            constant: true,
            text: _value,
            value: Number(_value)
          });
        } else if (isIdent(char)) {
          // 标识符
          var _start2 = index;
          while (index < length) {
            var _c2 = content.charAt(index);
            if (!(isIdent(_c2) || isNumber(_c2))) {
              break;
            }
            index++;
          }

          tokens.push({
            index: _start2,
            text: content.slice(_start2, index),
            identifier: true
          });
        } else if ('(){}[].,;:?'.indexOf(char) >= 0) {
          // 边界
          tokens.push({
            index: index,
            text: char
          });

          index++;
        } else if (char === ' ' || char === '\r' || char === '\t' || char === '\n' || char === '\v' || char === '\xA0') {
          // 空格
          index++;
        } else {
          // 操作符
          var char2 = char + content.charAt(index + 1);
          var char3 = char2 + content.charAt(index + 2);
          var op1 = OPERATORS[char];
          var op2 = OPERATORS[char2];
          var op3 = OPERATORS[char3];
          if (op1 || op2 || op3) {
            var text = op3 ? char3 : op2 ? char2 : char;

            tokens.push({
              index: index,
              text: text,
              operator: true
            });

            index += text.length;
          } else {
            throw new Error('invalid expression: ' + content);
          }
        }
      }

      this.tokens = tokens;
      return tokens;
    }
  }, {
    key: 'parse',
    value: function parse() {
      var tokens = this.lex();

      var func = void 0;
      var token = tokens[0];
      var text = token.text;

      if (tokens.length > 0 && text !== '}' && text !== ')' && text !== ']') {
        func = this.expression();
      }

      return function (data) {
        return func && func(data);
      };
    }
  }, {
    key: 'expect',
    value: function expect(text) {
      var tokens = this.tokens;
      var token = tokens[0];

      if (!text || text === (token && token.text)) {
        return tokens.shift();
      }
    }
  }, {
    key: 'consume',
    value: function consume(text) {
      if (!this.tokens.length) throw new Error('parse expression error: ' + this.content);

      var token = this.expect(text);
      if (!token) throw new Error('parse expression error: ' + this.content);

      return token;
    }
  }, {
    key: 'expression',
    value: function expression() {
      return this.ternary();
    }
  }, {
    key: 'ternary',
    value: function ternary() {
      var left = this.logicalOR();
      var token = void 0;

      if (token = this.expect('?')) {
        var middle = this.expression();

        this.consume(':');
        var right = this.expression();

        return function (data) {
          return left(data) ? middle(data) : right(data);
        };
      }

      return left;
    }
  }, {
    key: 'binary',
    value: function binary(left, op, right) {
      var fn = OPERATORS[op];

      return function (data) {
        return fn(data, left, right);
      };
    }
  }, {
    key: 'unary',
    value: function unary() {
      var token = void 0;

      if (this.expect('+')) {
        return this.primary();
      } else if (token = this.expect('-')) {
        return this.binary(function (data) {
          return 0;
        }, token.text, this.unary());
      } else if (token = this.expect('!')) {
        var fn = OPERATORS[token.text];
        var right = this.unary();

        return function (data) {
          return fn(data, right);
        };
      } else {
        return this.primary();
      }
    }
  }, {
    key: 'logicalOR',
    value: function logicalOR() {
      var left = this.logicalAND();
      var token = void 0;

      while (token = this.expect('||')) {
        left = this.binary(left, token.text, this.logicalAND());
      }

      return left;
    }
  }, {
    key: 'logicalAND',
    value: function logicalAND() {
      var left = this.equality();
      var token = void 0;

      while (token = this.expect('&&')) {
        left = this.binary(left, token.text, this.equality());
      }

      return left;
    }
  }, {
    key: 'equality',
    value: function equality() {
      var left = this.relational();
      var token = void 0;

      while (token = this.expect('==') || this.expect('!=') || this.expect('===') || this.expect('!==')) {
        left = this.binary(left, token.text, this.relational());
      }

      return left;
    }
  }, {
    key: 'relational',
    value: function relational() {
      var left = this.additive();
      var token = void 0;

      while (token = this.expect('<') || this.expect('>') || this.expect('<=') || this.expect('>=')) {
        left = this.binary(left, token.text, this.additive());
      }

      return left;
    }
  }, {
    key: 'additive',
    value: function additive() {
      var left = this.multiplicative();
      var token = void 0;

      while (token = this.expect('+') || this.expect('-')) {
        left = this.binary(left, token.text, this.multiplicative());
      }

      return left;
    }
  }, {
    key: 'multiplicative',
    value: function multiplicative() {
      var left = this.unary();
      var token = void 0;

      while (token = this.expect('*') || this.expect('/') || this.expect('%')) {
        left = this.binary(left, token.text, this.unary());
      }

      return left;
    }
  }, {
    key: 'primary',
    value: function primary() {
      var token = this.tokens[0];
      var primary = void 0;

      if (this.expect('(')) {
        primary = this.expression();
        this.consume(')');
      } else if (this.expect('[')) {
        primary = this.array();
      } else if (this.expect('{')) {
        primary = this.object();
      } else if (token.identifier && token.text in CONSTANTS) {
        primary = CONSTANTS[this.consume().text];
      } else if (token.identifier) {
        primary = this.identifier();
      } else if (token.constant) {
        primary = this.constant();
      } else {
        throw new Error('parse expression error: ' + this.content);
      }

      var next = void 0;
      var context = void 0;
      while (next = this.expect('(') || this.expect('[') || this.expect('.')) {
        if (next.text === '(') {
          primary = this.functionCall(primary, context);
          context = null;
        } else if (next.text === '[') {
          context = primary;
          primary = this.objectIndex(primary);
        } else {
          context = primary;
          primary = this.fieldAccess(primary);
        }
      }
      return primary;
    }
  }, {
    key: 'fieldAccess',
    value: function fieldAccess(object) {
      var getter = this.identifier();

      return function (data) {
        var o = object(data);
        return o && getter(o);
      };
    }
  }, {
    key: 'objectIndex',
    value: function objectIndex(object) {
      var indexFn = this.expression();

      this.consume(']');

      return function (data) {
        var o = object(data);
        var key = indexFn(data) + '';

        return o && o[key];
      };
    }
  }, {
    key: 'functionCall',
    value: function functionCall(func, context) {
      var args = [];

      if (this.tokens[0].text !== ')') {
        do {
          args.push(this.expression());
        } while (this.expect(','));
      }

      this.consume(')');

      return function (data) {
        var callContext = context && context(data);
        var fn = func(data, callContext);

        return fn && fn.apply(callContext, args.length ? args.map(function (arg) {
          return arg(data);
        }) : null);
      };
    }
  }, {
    key: 'array',
    value: function array() {
      var elements = [];
      var token = this.tokens[0];

      if (token.text !== ']') {
        do {
          if (this.tokens[0].text === ']') break;

          elements.push(this.expression());
        } while (this.expect(','));
      }

      this.consume(']');

      return function (data) {
        return elements.map(function (element) {
          return element(data);
        });
      };
    }
  }, {
    key: 'object',
    value: function object() {
      var keys = [];
      var values = [];
      var token = this.tokens[0];

      if (token.text !== '}') {
        do {
          token = this.tokens[0];
          if (token.text === '}') break;

          token = this.consume();
          if (token.constant) {
            keys.push(token.value);
          } else if (token.identifier) {
            keys.push(token.text);
          } else {
            throw new Error('parse expression error: ' + this.content);
          }

          this.consume(':');
          values.push(this.expression());
        } while (this.expect(','));
      }

      this.consume('}');

      return function (data) {
        var object = {};
        for (var i = 0, length = values.length; i < length; i++) {
          object[keys[i]] = values[i](data);
        }
        return object;
      };
    }
  }, {
    key: 'identifier',
    value: function identifier() {
      var id = this.consume().text;

      var token = this.tokens[0];
      var token2 = this.tokens[1];
      var token3 = this.tokens[2];

      // 连续读取 . 操作符后的非函数调用标识符
      while (token && token.text === '.' && token2 && token2.identifier && token3 && token3.text !== '(') {
        id += this.consume().text + this.consume().text;

        token = this.tokens[0];
        token2 = this.tokens[1];
        token3 = this.tokens[2];
      }

      return function (data) {
        var elements = id.split('.');
        var key = void 0;

        for (var i = 0; elements.length > 1; i++) {
          key = elements.shift();
          data = data[key];

          if (!data) break;
        }

        key = elements.shift();

        return data && data[key];
      };
    }
  }, {
    key: 'constant',
    value: function constant() {
      var value = this.consume().value;

      return function (data) {
        return value;
      };
    }
  }]);

  return Expression;
}();

module.exports = Expression;