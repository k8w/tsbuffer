// if (root.atob) {
//     // Some browsers' implementation of atob doesn't support whitespaces
//     // in the encoded string (notably, IE). This wraps the native atob
//     // in a function that strips the whitespaces.
//     // The original function can be retrieved in atob.original
//     try {
//         root.atob(" ");
//     } catch (e) {
//         root.atob = (function (atob) {
//             var func = function (string) {
//                 return atob(String(string).replace(/[\t\n\f\r ]+/g, ""));
//             };
//             func.original = atob;
//             return func;
//         })(root.atob);
//     }
//     return;
// }

// base64 character set, plus padding character (=)
var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

export function btoa (string) {
    var bitmap, a, b, c,
        result = "", i = 0,
        rest = string.length % 3; // To determine the final padding

    for (; i < string.length;) {
        if ((a = string.charCodeAt(i++)) > 255
            || (b = string.charCodeAt(i++)) > 255
            || (c = string.charCodeAt(i++)) > 255)
            throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");

        bitmap = (a << 16) | (b << 8) | c;
        result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63)
            + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
    }

    // If there's need of padding, replace the last 'A's with equal signs
    return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
};

export function atob (string) {
    // atob can work with strings with whitespaces, even inside the encoded part,
    // but only \t, \n, \f, \r and ' ', which can be stripped.
    // string = string.replace(/[\t\n\f\r ]+/g, "");

    // Adding the padding if missing, for semplicity
    string += "==".slice(2 - (string.length & 3));

    var bitmap, result = "", r1, r2, i = 0;
    for (; i < string.length;) {
        bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
            | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));

        result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
            : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
                : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
    }
    return result;
};