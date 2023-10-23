const vscode = require('vscode')

////////////////////////////////////////////////////////////////
// CONSTANTS/CONFIG

const TITLE = 'Repeat Text'
const DOCUMENT_START = new vscode.Position(0,0)

////////////////////////////////////////////////////////////////
// HELPERS

function truncate(what, maxlen)
{
	if (what.length > maxlen)
		return what.slice(0, maxlen - 3) + '...'
	return what
}

function showNumericInput(what)
{
	const prompt = 'Enter the number of times to repeat'

	if (what)
		what += ` "${truncate(what, 12)}"`

	return vscode.window.showInputBox({
		value: '',
		valueSelection: [0, 3],
		title: TITLE,
		prompt: prompt,
		validateInput: text => {
			return !isNaN(parseInt(text))
		}
	})
}

function nrepeat(activeEditor, inserter)
{
	function insertR(index)
	{
		if (index < activeEditor.selections.length)
		{
			activeEditor
				.edit(e => inserter(e, index))
				.then(() => insertR(index + 1))
		}
	}
	
	insertR(0)
}

function checkEditor()
{
	const activeEditor = vscode.window.activeTextEditor

	if (!activeEditor) {
		vscode.window.showInformationMessage(`No active editor.`)
		return null
	}

	return activeEditor
}

////////////////////////////////////////////////////////////////
// MAIN COMMAND HANDLER: nrepeat selected
// text or char before cursor

function nrepeatNearCursor()
{
	const activeEditor = checkEditor()

	if (activeEditor)
	{
		const CFG = vscode.workspace.getConfiguration("nrepeat")

		showNumericInput()
			.then(count => {
				const sels = [ ...activeEditor.selections ]

				function inserter(e, isel)
				{
					let range = undefined
					const sel = activeEditor.selections[isel]

					if (sel.isEmpty)
					{
						if (sel.start.isAfter(DOCUMENT_START))
							range = new vscode.Range(sel.start.translate(0, -1), sel.start)
					}
					else
						range = new vscode.Range(sel.start, sel.end)

					if (range)
					{
						e.insert(sel.active, activeEditor.document.getText(range).repeat(count))

						if (!sel.isEmpty && CFG.selectionAfterRepeat !== "keep")
						{
							if (CFG.selectionAfterRepeat === "before")
								sels[isel] = new vscode.Selection(sel.start, sel.start)
							else
								sels[isel] = new vscode.Selection(sel.end, sel.end)
						}
					}
				}

				nrepeat(activeEditor, inserter)
				activeEditor.selections = sels
			})
	}
}

////////////////////////////////////////////////////////////////
// MAIN COMMAND HANDLER: nrepeat text from user input

function nrepeatPrompt()
{
	const activeEditor = checkEditor()

	if (activeEditor)
		vscode.window.showInputBox({
			title: TITLE,
			prompt: 'Enter text to repeat',
		}).then(textToRepeat => {
			showNumericInput()
				.then(count => {
					const txt = textToRepeat.repeat(count)
					const inserter = (e, isel) =>
						e.insert(activeEditor.selections[isel].active, txt)
					nrepeat(activeEditor, inserter)
				})
		})
}

////////////////////////////////////////////////////////////////
// VSCODE

function activate(context)
{
	let disposable = undefined

	disposable = vscode.commands.registerCommand('nrepeat.nrepeatPrompt', () => {
		nrepeatPrompt()
	})

	context.subscriptions.push(disposable)

	disposable = vscode.commands.registerCommand('nrepeat.nrepeatNearCursor', () => {
		nrepeatNearCursor()
	})

	context.subscriptions.push(disposable)
}

function deactivate()
{
	// TODO?
}

module.exports = {
	activate,
	deactivate
}