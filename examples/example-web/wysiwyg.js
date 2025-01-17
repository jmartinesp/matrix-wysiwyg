import init, { new_composer_model } from './generated/wysiwyg.js';

let composer_model;
let editor;

async function run() {
    await init();

    composer_model = new_composer_model();

    editor = document.getElementById('editor');
    editor.addEventListener('input', editor_input);
    editor.addEventListener("keydown", editor_keydown);
    document.addEventListener('selectionchange', selectionchange);
    editor.focus();
}

function editor_input(e) {
    const update = process_input(e);
    if (update) {
        const repl = update.text_update().replace_all;
        if (repl) {
            replace_editor(
                repl.replacement_html,
                repl.selection_start_codepoint,
                repl.selection_end_codepoint
            );
        }
    }
}

function editor_keydown(e) {
    if (!e.ctrlKey) {
        return;
    }
    switch (e.key) {
        case 'b':
            editor.dispatchEvent(
                new InputEvent(
                    'input',
                    { inputType: "formatBold" }
                )
            );
            e.preventDefault();
            break;
    }
}

function selectionchange() {
    const s = document.getSelection();
    //const textNode = editor.childNodes[0];
    // TODO: check that the selection is happening within the editor!
    // TODO: any node within editor is relevant, not just editor itself.
    // TODO: if anchor or focus are outside editor but not both, we should
    //       change the selection, cutting off at the edge.
    const start_codepoint = codepoint(s.anchorNode, s.anchorOffset);
    const end_codepoint = codepoint(s.focusNode, s.focusOffset);
    composer_model.select(start_codepoint, end_codepoint);
}

function codepoint(current_node, offset) {
    function impl(current_node, offset) {
        if (current_node.nodeType === Node.TEXT_NODE) {
            if (offset <= current_node.textContent.length) {
                return { found: true, offset };
            } else {
                return { found: false, offset: current_node.textContent.length };
            }
        } else {
            let sum = 0;
            for (const ch of current_node.childNodes) {
                const cp = impl(ch, offset - sum);
                if (cp.found) {
                    return { found: true, offset: sum + cp.offset };
                } else {
                    sum += cp.offset;
                }
            }
            return { found: false, offset: sum };
        }
    }

    const ret = impl(current_node, offset);
    if (ret.found) {
        return ret.offset;
    } else {
        return 0;
    }
}

function node_and_offset(current_node, codepoint) {
    if (current_node.nodeType === Node.TEXT_NODE) {
        if (codepoint <= current_node.textContent.length) {
            return { node: current_node, offset: codepoint };
        } else {
            return {
                node: null,
                offset: codepoint - current_node.textContent.length
            };
        }
    } else {
        for (const ch of current_node.childNodes) {
            const ret = node_and_offset(ch, codepoint);
            if (ret.node) {
                return { node: ret.node, offset: ret.offset };
            } else {
                codepoint -= ret.offset;
            }
        }
        return { node: null, offset: codepoint };
    }
}

function replace_editor(html, start_codepoint, end_codepoint) {
    console.log("replace_editor", html, start_codepoint, end_codepoint);
    editor.innerHTML = html;

    const sr = () => {

        const range = document.createRange();

        let start = node_and_offset(editor, start_codepoint);
        let end = node_and_offset(editor, end_codepoint);

        if (start.node && end.node) {
            // Ranges must always have start before end
            if (
                start.node.compareDocumentPosition(end.node)
                    & Node.DOCUMENT_POSITION_PRECEDING
            ) {
                [start, end] = [end, start];
            }

            range.setStart(start.node, start.offset);
            range.setEnd(end.node, end.offset);
            var sel = document.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            console.error("Failed to find offsets", start, end);
        }
    };

    sr();
}

function process_input(e) {
    switch (e.inputType) {
        case "insertText":
            return composer_model.replace_text(e.data);
        case "insertParagraph":
            return composer_model.enter(e.data);
        case "deleteContentBackward":
            return composer_model.backspace(e.data);
        case "deleteContentForward":
            return composer_model.delete(e.data);
        case "formatBold":
            return composer_model.bold();
        default:
            // TODO: cover all of https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
            console.error(`Unknown input type: ${e.inputType}`);
            console.error(e);
            return null;
    }
}

run();
