// starts at 21:14
// at 21:24—21:44 отвлёкся на эксперименты с es6 классами
// at 21:47—22:02 отвлёкся на общение и проверку событий js+dom
// at 22:03—22:05 пошёл общаться с соседом
// at 22:10—23:44 пошёл общаться с соседом
// at 00:00—00:05 пошёл поужинать
// at 00:10—10:30 спал
// at 11:50 приступил к отладке
// at 15:22 готово
// apprx. 10:00 summary

var removeComments = (() => {'use strict';
    let i = 0; // enum index
    // enum states dict
    let s = {
        INIT: i++,
        N: i++, // nope
        _: i++, // keep current state (fake state)
        
        COMM_: i++, // line-comment candidate

        // liny-comment
        LCOMM: i++,
        
        // blocky-comment
        BCOMM: i++,
        BCOMM$_: i++, // block-comment end candidate
        
        ESC: i++,
        lSTR: i++, // 'string'
        llSTR: i++, // "string"

        ERR: i++,
    };

    let s_ = _.invert(s); // id to string representation

    // matrix json { symbol: { currState: newState,,, },,, }
    let symbolToState = (() => {

        let convertSymbols = (symbolsRaw) =>
            symbolsRaw.map(symbol => symbol === '\\n' ? '\n' : symbol);

        let stateTransDSL = `
                    \'    "     /     *    \\    \\n
        N           lSTR  llSTR COMM_ _    ESC    _
        COMM_       _     _     LCOMM BCOMM ESC   _
        LCOMM       _     _     _     _     _     N
        BCOMM       _     _     _     BCOMM$_ ESC _
        BCOMM$_     _     _     N     _     ESC   _
        ESC         _     _     _     _     _     _
        lSTR        N     _     _     _     ESC   ERR
        llSTR       _     N     _     _     ESC   ERR
        `.trim().split(/\n/);
        
        let stateTransRaw    = _.drop(stateTransDSL); // del left head col
        let symbolsRaw       = stateTransDSL[0].trim().split(/\s+/);
        let symbols          = convertSymbols(symbolsRaw);
        let statesTable      = stateTransRaw.map(row=>row.trim().split(/\s+/));
        let statesCollection = statesTable.map(row    => row[0]);
        let statesMatrix     = statesTable.map(row    => _.drop(row))

        return _(symbols).invert().mapValues((i, symbol) => 
            _(statesCollection).invert().mapValues((j, state) =>
                statesMatrix[j][i]
            ).value()
        ).value();

    })();

    let state = s.N;
    let prevUnclassifiedChars = [];

    function CommentsRemover () {

        this.state = state;

        this.output = '';

        this.printPrevChars = () => {
            prevUnclassifiedChars.forEach(this.print);
            return this;
        };

        this.clearPrevChars = () => {
            prevUnclassifiedChars = [];
            return this;
        };

        this.processNextChar = (char) => {
            let state = this.calcNewState(char);
            // console.log('%s: %s --> %s', char, s_[this.state], s_[state]);

            switch(state) {
            case(s.COMM_):
                prevUnclassifiedChars.push(char);
            break;
            case(s.BCOMM):
            case(s.LCOMM):
                this.clearPrevChars();
            break;
            case(s.N):
            case(s.ESC):
            case(s.lSTR):
            case(s.llSTR):
            case(s.ERR):
                if (prevUnclassifiedChars.length) {
                    this.printPrevChars().clearPrevChars();
                }
                
                this.print(char);

                if (state === s.ERR) {
                    console.log('misformat: ' + char)
                }
            break;
            }

            this.state = state;
        };

        this.calcNewState = (char) => {
            // Может быть фейковым состоянием (_ = keep state)
            let stateRaw = symbolToState[char]
                ? this.stateToConst(symbolToState[char][s_[this.state]])
                : this.state;
            
            return stateRaw === s._ ? this.state : stateRaw;
        };

        this.stateToConst = (stateStr) => { return s[stateStr] };

        this.print = (char) => { this.output += char };

        this.toValue = () => {
            let output = this.output;
            this.output = '';
            // Строки содержащие исключительно комментарии
            // оставляют после себя лишние \n
            let outputWithoutEmptyLines = output.replace(/^\s*$\n/gm, '');
            return outputWithoutEmptyLines;
        };

    }

    let removr = new CommentsRemover;

    let eachChar = (string, callback) => {
        for (let i = 0, len = string.length; i < len; ++i) {
            callback(string.charAt(i));
        }
    }

    // c-like line and block comments
    // supports ' and " strings
    // and string escaping
    let removeComments = codeString => {
        eachChar(codeString, removr.processNextChar);
        return removr.toValue();
    };

    return removeComments;
})();

// test
removeComments(`// starts at 21:14
// at 21:24—??:?? отвлёкся на эксперименты с es6 классами
// at 21:47—22:02 отвлёкся на общение и проверку событий js+dom
// at 22:03—22:05 пошёл общаться с соседом
// at 22:10—23:44 пошёл общаться с соседом
// at 00:00—00:05 пошёл поужинать
// at 00:10—10:30 спал
// at 11:50 приступил к отладке

!(() => {'use strict';
    let i = 0; // enum index
    // enum states dict
    let s = {
        INIT: i++,
        N: i++, // nope
        K: i++, // keep current state (fake state)
    };
})()`)
