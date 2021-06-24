export const next =
    "         "
    + "  *   *  "
    + "  **  *  "
    + "  *** *  "
    + "  *****  "
    + "  *** *  "
    + "  **  *  "
    + "  *   *  "
    + "         ";

export const previous = next.split("").reverse().join("");

export const music =
    "  *****  "
    + "  *****  "
    + "  *   *  "
    + "  *   *  "
    + "  *   *  "
    + " **  **  "
    + "*** ***  "
    + " *   *   "
    + "         ";

export const play =
    "         "
    + "   *     "
    + "   **    "
    + "   ***   "
    + "   ****  "
    + "   ***   "
    + "   **    "
    + "   *     "
    + "         ";

export const pause =
    "         "
    + "  ** **  "
    + "  ** **  "
    + "  ** **  "
    + "  ** **  "
    + "  ** **  "
    + "  ** **  "
    + "  ** **  "
    + "         ";

export const numbers = [
    "    "
    + " ** "
    + "*  *"
    + "*  *"
    + "*  *"
    + "*  *"
    + "*  *"
    + " ** "
    + "    ",
    "    "
    + "  * "
    + "  * "
    + "  * "
    + "  * "
    + "  * "
    + "  * "
    + "  * "
    + "    ",
    "    "
    + " ** "
    + "   *"
    + "   *"
    + " ** "
    + "*   "
    + "*   "
    + " ** "
    + "    ",
    "    "
    + " ** "
    + "*  *"
    + "   *"
    + " ** "
    + "   *"
    + "*  *"
    + " ** "
    + "    ",
    "    "
    + "    "
    + "*  *"
    + "*  *"
    + " ***"
    + "   *"
    + "   *"
    + "    "
    + "    ",
    "    "
    + " ** "
    + "*   "
    + "*   "
    + " ** "
    + "   *"
    + "   *"
    + " ** "
    + "    ",
    "    "
    + " ** "
    + "*   "
    + "*   "
    + "*** "
    + "*  *"
    + "*  *"
    + " ** "
    + "    ",
    "    "
    + " ** "
    + "   *"
    + "   *"
    + "   *"
    + "   *"
    + "   *"
    + "    "
    + "    ",
    "    "
    + " ** "
    + "*  *"
    + "*  *"
    + " ** "
    + "*  *"
    + "*  *"
    + " ** "
    + "    ",
    "    "
    + " ** "
    + "*  *"
    + "*  *"
    + " ***"
    + "   *"
    + "   *"
    + " ** "
    + "    ",
];

export const hundret =
    "         "
    + "         "
    + "* *** ***"
    + "* * * * *"
    + "* * * * *"
    + "* * * * *"
    + "* *** ***"
    + "         "
    + "         ";

export function matrixFromNumber(number) {
    const empty = Array(36 + 1).join(" ")

    if (number == 100)
        return hundret;
    else if (number < 0 || number > 100)
        throw new Error("Invalid number, must be between 0 and 100");
    
    const left = Math.floor(number / 10) === 0 ? empty : numbers[Math.floor(number / 10)];
    const right = numbers[number % 10];

    let final = "";

    for (let i = 0; i < 9; i++)
        final += left.substring(4 * i, 4 * (i + 1)) + " " + right.substring(4 * i, 4 * (i + 1));
        
    return final;
}

export function lineMatrixFromNumber(number) {

    let final = "";

    if (number > 100 || number < 0)
        throw new Error("Invalid number");

    for (let i = 9; i > 0; i--) 
        final += number >= i * 10 ? "    *    " : "         ";

    return final;
}