/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import { Disposable, QuickInput, QuickInputButton, QuickInputButtons, QuickPickItem, window } from "vscode";

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title: string;
  step: number;
  totalSteps: number;
  items: T[];
  activeItem?: T;
  placeholder: string;
  buttons?: QuickInputButton[];
}

interface AsyncQuickPickParameters<T extends QuickPickItem> {
  title: string;
  step: number;
  totalSteps: number;
  itemsPromise: Promise<T[]>;
  activeItem?: T;
  placeholder: string;
  loadingPlaceholder?: string;
  buttons?: QuickInputButton[];
}

interface InputBoxParameters {
  title: string;
  step: number;
  totalSteps: number;
  value: string;
  prompt?: string;
  placeholder: string;
  validate: (value: string) => Promise<string | undefined>;
  buttons?: QuickInputButton[];
}

class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

export class MultiStepInput {
  private current?: QuickInput;
  private steps: InputStep[] = [];

  static async run(start: InputStep) {
    const input = new MultiStepInput();
    return input.stepThrough(start);
  }

  private async stepThrough(start: InputStep) {
    let step: InputStep | void = start;

    while (step) {
      this.steps.push(step);

      if (this.current) {
        this.current.enabled = false;
        this.current.busy = true;
      }

      try {
        step = await step(this);
      } catch (err) {
        switch (err) {
          case InputFlowAction.back:
            this.steps.pop();
            step = this.steps.pop();
            break;
          case InputFlowAction.resume:
            step = this.steps.pop();
            break;
          case InputFlowAction.cancel:
            step = undefined;
            break;
          default:
            throw err;
        }
      }
    }

    if (this.current) {
      this.current.dispose();
    }
  }


  async showQuickPick<
    T extends QuickPickItem,
    P extends QuickPickParameters<T>
  >({ title, step, totalSteps, items, activeItem, placeholder, buttons }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        T | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createQuickPick<T>();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.placeholder = placeholder;
        input.items = items;
        input.activeItems = activeItem ? [activeItem] : [];

        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];
        disposables.push(
          input.onDidTriggerButton((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item === QuickInputButtons.Back ? reject(InputFlowAction.back) : resolve(<any>item);
          }),
          input.onDidChangeSelection((items) => resolve(items[0]))
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }

  /**
   * Shows a quick pick that displays immediately with a loading state while items are being fetched.
   * This provides better perceived performance by showing the UI instantly.
   */
  async showQuickPickAsync<
    T extends QuickPickItem,
    P extends AsyncQuickPickParameters<T>
  >({ title, step, totalSteps, itemsPromise, activeItem, placeholder, loadingPlaceholder, buttons }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<
        T | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createQuickPick<T>();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.placeholder = loadingPlaceholder || placeholder;
        input.items = [];
        input.busy = true;
        input.enabled = false;

        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];

        disposables.push(
          input.onDidTriggerButton((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            item === QuickInputButtons.Back ? reject(InputFlowAction.back) : resolve(<any>item);
          }),
          input.onDidChangeSelection((items) => resolve(items[0])),
          input.onDidHide(() => reject(InputFlowAction.cancel))
        );

        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();

        // Load items asynchronously
        itemsPromise.then((items) => {
          input.items = items;
          input.activeItems = activeItem ? [activeItem] : [];
          input.placeholder = placeholder;
          input.busy = false;
          input.enabled = true;
        }).catch((error) => {
          reject(error);
        });
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value = "",
    prompt,
    placeholder,
    validate,
    buttons,
  }: P) {
    const disposables: Disposable[] = [];
    let validating = validate("");

    try {
      return await new Promise<
        string | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createInputBox();
        input.title = title;
        input.step = step;
        input.totalSteps = totalSteps;
        input.value = value;
        input.prompt = prompt;
        input.placeholder = placeholder;

        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
          ...(buttons || []),
        ];

        disposables.push(
          input.onDidTriggerButton((item) =>
            item === QuickInputButtons.Back
              ? reject(InputFlowAction.back)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              : resolve(<any>item)
          ),

          input.onDidAccept(async () => {
            const inputValue = input.value;
            input.enabled = false;
            input.busy = true;

            if (!(await validate(inputValue))) {
              resolve(inputValue);
            }

            input.enabled = true;
            input.busy = false;
          }),

          input.onDidChangeValue(async (text) => {
            const current = validate(text);
            validating = current;

            const validationMessage = await current;
            switch (current) {
              case validating:
                input.validationMessage = validationMessage;
                break;
              default:
                break;
            }
          })
        );

        if (this.current) {
          this.current.dispose();
        }

        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }

}
