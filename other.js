                            for (const [id, word] of Object.entries(words)) {
                                if (word.blueChars.includes(inputWord[c])) {
                                    word.blueChars = aRem(word.blueChars, inputWord[c]);
                                }
                            }
                            words[selectedWord].letters[c].status = "GREEN";
                            if (words[selectedWord].orientation == "H") {
                                let beginConstr = 5;
                                for (let i = 0; i < 5; i++) {
                                    if (letterMap.includes(`${pos[0]+c}:${pos[1]-1-i}`) || letterMap.includes(`${pos[0]+c-1}:${pos[1]-1-i}`) || letterMap.includes(`${pos[0]+c+1}:${pos[1]-1-i}`)) {
                                        beginConstr = i
                                        break;
                                    }
                                }
                                let endConstr = 5;
                                for (let i = 0; i < 5; i++) {
                                    if (letterMap.includes(`${pos[0]+c}:${pos[1]+1+i}`) || letterMap.includes(`${pos[0]+c-1}:${pos[1]+1+i}`) || letterMap.includes(`${pos[0]+c+1}:${pos[1]+1+i}`)) {
                                        endConstr = i;
                                        break;
                                    }
                                }
                            }
                            else if (words[selectedWord].orientation == "V") {
                                let beginConstr = 5;
                                for (let i = 0; i < 5; i++) {
                                    if (letterMap.includes(`${pos[0]-1-i}:${pos[1]+c}`) || letterMap.includes(`${pos[0]-1-i}:${pos[1]+c-1}`) ||  letterMap.includes(`${pos[0]-1-i}:${pos[1]+c+1}`)) {
                                        beginConstr = i;
                                        break;
                                    }
                                }
                                let endConstr = 5;
                                for (let i = 0; i < 5; i++) {
                                    if (letterMap.includes(`${pos[0]+1+i}:${pos[1]+c}`) || letterMap.includes(`${pos[0]+1+i}:${pos[1]+c-1}`) || letterMap.includes(`${pos[0]+1+i}:${pos[1]+c+1}`)) {
                                        endConstr = i;
                                        break;
                                    }
                                }
                            }
                            if (beginConstr+endConstr+1 >= 5 && ![beginConstr,endConstr].includes(0)) {
                                let newWord = getWord(inputWord[c],beginConstr-1,endConstr-1);
                                if (newWord != null) {
                                    founds = newWord.reduce((z1, z2, z3) => {
                                        if(z2 == inputWord[c]) z1.push(z3);
                                        return z1;
                                    }, []);
                                    let index = founds.choice();
                                    if (words[selectedWord].orientation == "H") {
                                        newID = `v${pos[0]+c},${pos[1]-index}`;
                                        ltrID = [pos[0]+c,pos[1]-index];
                                    }
                                    else {
                                        newID = `h${pos[0]-index},${pos[1]+c}`;
                                        ltrID = [pos[0]-index,pos[1]+c];
                                    }
                                    words[newID] = new Word(newWord);
                                    
                                    if (words[selectedWord].orientation == "H") {
                                        words[newID].orientation = "V";
                                    }
                                    words[newID].letters[index].status = "GREEN";
                                    words[newID].letters[index].displaychar = inputWord[c];
                                    if (words[newID].orientation == "V") {
                                        for (let i = 0; i < 5; i++) {
                                            if (!letterMap.includes(`${ltrID[0]}:${ltrID[1]+i}`)) {
                                                letterMap.push(`${ltrID[0]}:${ltrID[1]+i}`);
                                            }
                                        }
                                    }
                                    else if (words[newID].orientation == "H") {
                                        for (let i = 0; i < 5; i++) {
                                            if (!letterMap.includes(`${ltrID[0]+i}:${ltrID[1]}`)) {
                                                letterMap.push(`{ltrID[0]+i}:{ltrID[1]}`);
                                            }
                                        }
                                    }
                        else if (!gred.includes(words[selectedWord].letters[c].status)) {
                            for (const l of words[selectedWord].letters) {
                                if (gred.includes(l.status) && l.character == inputWord[c]) {
                                    if (!words[selectedWord].yellowChars.includes(inputWord[c])) {
                                        words[selectedWord].yellowChars.push(inputWord[c]);
                                    }
                                    if (!words[selectedWord].letters[c].yellows.includes(inputWord[c])) {
                                        words[selectedWord].letters[c].yellows.push(inputWord[c]);
                                    }
                                }
                            }
                            let foundChar = false;
                            for (const [yid, yword] of Object.entries(words)) {
                                if (yword != words[selectedWord]) {
                                    for (const l of yword.letters) {
                                        if (!gred.includes(l.status) && l.character == inputWord[c]) {
                                            foundChar = false;
                                        }
                                    }
                            if (foundChar && !words[selectedWord].yellowChars.includes(inputWord[c])) {
                                words[selectedWord].blueChars.push(inputWord[c])
                            if (!words[selectedWord].yellowChars.includes(inputWord[c]) && !words[selectedWord].blueChars.includes(inputWord[c])) {
                                bannedChars.push(inputWord[c]);
                            words[selectedWord].letters[c].displaychar = "";