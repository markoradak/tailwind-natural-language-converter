import * as vscode from 'vscode';
import OpenAI from 'openai';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.convertToTailwind', async () => {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const document = editor.document;
      const position = editor.selection.active;
      const line = document.lineAt(position.line);
      const inputText = line.text.trim();

      if (inputText) {
        const envApiKey = process.env.OPENAI_API_KEY;
        let apiKey = vscode.workspace.getConfiguration('tailwindExtension').get('openAIKey');
        if (!apiKey) { apiKey = envApiKey; }

        if (!apiKey) {
          vscode.window.showErrorMessage('OpenAI API key is not set. Please set it in your environment variables or configure it in the extension settings.');
          return;
        }

        const response = await transformTextToTailwind(inputText);

        if (response) {
          editor.edit(editBuilder => {
            editBuilder.replace(line.range, `${response}`);
          });
        }
      }
    }
  });

  context.subscriptions.push(disposable);
}

async function transformTextToTailwind(inputText: string): Promise<string | null> {
  try {
    const openai = new OpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user', 
        content: `Convert the input to an html element with a valid Tailwind CSS syntax. Respond only with the conversion in the following style: <div className="flex justify-center">. INPUT: ${inputText}`
      }],
    });

    if (response && response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content) {
      return response.choices[0].message.content.trim() || null;
    }
    return null;
  } catch (error) {
    const errorMessage = (error as Error).message;
    vscode.window.showErrorMessage('Error while transforming text: ' + errorMessage);
    return null;
  }
}

export function deactivate() {}
