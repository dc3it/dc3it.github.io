import { LightningElement, api, track, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id'; //important to get the path correct - this gets the logged in user id
import FIRST_NAME from '@salesforce/schema/User.FirstName'; //this is the query in essence to be run to get the value
import LAST_NAME from '@salesforce/schema/User.LastName'; // same as above
import EMAIL from '@salesforce/schema/User.Email'; // same as above
import toast from 'lightning/toast';
import toastLocation from 'lightning/toastContainer';
// trying to use a static resource to get past the salesforce security roadblock on the AI APIs
//import { loadScript } from 'lightning/platformResourceLoader';
//import AI_BRIDGE from '@salesforce/resourceUrl/aiBridge';



const FIELDS = [FIRST_NAME, LAST_NAME, EMAIL]; //have to create an in memory store that holds
//the queries from above to pass that in to the getRecord by Id query

export default class LocalWebAi extends LightningElement {
    @track streamingText = '';
    @api recordId; //special variable to easily get the recordId of the loaded page
    @api objectApiName; //same as above
    bodyText = "using a variable to output text"; //plain text variable
    userId = Id; //the query from above returns the user id to store in a variable
    toastContainer;

    // #region *** globals ***
    // Description: 
    // Created on: 2026.04.28
    // Modified on:
    // ***
    //aiAvailability;
    //aiSession;
    //modelStatusEl = document.querySelector("#model-status");
    //messagesEl = document.getElementById("messages");
    //inputPrompt = document.getElementById("input");
    //sendBtn = document.getElementById("send");
    //toast = document.getElementById('toast');
    //controller = new AbortController();
    //text = document.querySelector("#stop").onclick = () => controller.abort();
    //import { marked } from "https://cdn.jsdelivr.net/npm/marked@13.0.3/lib/marked.esm.js"; //uncomment to use output option 2
    //import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify@3.4.1/dist/purify.es.mjs";
    //import * as smd from "https://cdn.jsdelivr.net/npm/streaming-markdown/smd.min.js";
    // #endregion


    // this is a page lifecycle deal and the most commonly used one
    // it allows for the toastContainer's location to be set in the below code when rendering
    connectedCallback() {
        this.toastContainer = toastLocation.instance();
        console.log('Direct Window Local AI check:', window.hasOwnProperty('LanguageModel'));
        console.log('Direct window Local AI Object Includes LangugageModel', Object.keys(window).includes('LanguageModel'));
        ////trying to use a static resource to get this to recognize the AI APIs
        //try {
        //    await loadScript(this, AI_BRIDGE);
        //
        //    // 1. Check what the LWC sees directly
        //    console.log('LWC: window.LanguageModel check:', !!window.LanguageModel);
        //
        //    // 2. Check what the Bridge helper sees
        //    if (window.checkAiStatus) {
        //        console.log('LWC calling Bridge: Is AI available?', window.checkAiStatus());
        //    } else {
        //        console.log('LWC: Could not find checkAiStatus on window.');
        //    }
        //} catch (error) {
        //    console.error('Error loading static resource:', error);
        //}
        // Listen for the "ai_chunk" messages coming from the Visualforce page
        window.addEventListener("message", (event) => {
            // DEBUG: See if the message is even hitting the LWC
            console.log('LWC received message origin:', event.origin);
            console.log('LWC received data:', JSON.stringify(event.data));

            if (event.data.type === 'ai_chunk') {
                // Use a functional update to ensure the UI reacts
                this.streamingText = this.streamingText + event.data.text;
                console.log('Current streamingText length:', this.streamingText.length);
            }
        });
    }

    handleAiSend() {
        this.streamingText = ''; // Clear previous text
        const userPrompt = this.template.querySelector('.prompt-input').value;

        // Find the iframe using lwc:ref
        const bridge = this.refs.aiBridge;

        // Send the prompt to the Visualforce page
        bridge.contentWindow.postMessage({ prompt: userPrompt }, "*");
    }

    //@wire takes method to call, and params - send in the array to determine what to pull     
    //$userId is a reactive variable so if it changes you get wire to run again and get new values
    //getRecord stores the output of the call in the variable on the line below - LMAO
    //the fields variable passes in the queries to be run and returns values to it - double duty
    //pass in the query and then store the result
    @wire(getRecord, { recordId: '$userId', fields: FIELDS })
    user;

    //adding the get in front of the function allows you to display it
    //pull the value from the object and corresponding container name
    get firstName() {
        return getFieldValue(this.user.data, FIRST_NAME);
    }
    get lastName() {
        return getFieldValue(this.user.data, LAST_NAME);
    }
    get email() {
        return getFieldValue(this.user.data, EMAIL);
    }

    // #region *** check for local AI ***
    // Description: hendles processing the message
    // Created on: 2026.04.28
    // Modified on: 
    // ***
    async enableAI(event) {
        this.toastContainer.toastPosition = "top-right";
        //get property from checkbox control
        const useAI = event.target.checked;
        //this.bodyText = useAI;
        // check if checked
        if (useAI == true) {
            this.bodyText = "the button is on";
            toast.show({
                label: "AI Enabled",
                message: this.bodyText,
                variant: "success",
                mode: "dismissible"
            });
            // by default the org has Lightning Web Security turned on by default
            // this blocks the ability to see the local ai
            // to turn off go to Setup > Session Settings > and uncheck Use Lightning Web Security for Lightning web components and Aura components
            // this helped get rid of the object promise error for "LanguageModel" in self
            // but still won't evaluate the object
            // note this is the same location where under Caching > uncheck the Enable secure and persistent browser caching to improve performance - otherwise have to login and log out to get LWC to refresh
            // go to Setup > Settings > Trusted URLs and the domain https://*.force.com
            // check the box for Allow Site for Connect-src and save
            // still doesn't work
            // check in console if this returns true console.log('Direct Window AI check:', window.hasOwnProperty('LanguageModel'));
            // for the dev tools it returns true for the connectCallback it returns false so Salesforce is block this
            // going to try the static resource approach
            //Upload as a Static Resource
            //In Salesforce, go to Setup > Static Resources.
            //Click New.
            //Name it aiBridge.
            //Upload your aiBridge.js file.
            //Set Cache Control to Public and Save.
            // you can download via vscode static resources as well

            //if (typeof window.ai !== 'undefined' && window.ai.languageModel) {
            //if ("LanguageModel" in self) {
            //    try {
            //        toast.show({
            //            label: "AI Enabled",
            //            message: "Local AI Available for this computer.",
            //            variant: "info",
            //            mode: "dismissible"
            //        });
            //        //const capabilities = await window.ai.languageModel.capabilities();
//
            //        //if (capabilities.available !== 'no') {
            //        //    const session = await window.ai.languageModel.create();
            //        // Proceed with streaming...
            //        //}
            //    } catch (err) {
            //        console.error('Error initializing AI session:', err);
            //    }
            //} else {
            //    toast.show({
            //        label: "AI Not Enabled",
            //        message: "Local AI Not Available for this computer.",
            //        variant: "info",
            //        mode: "dismissible"
            //    });
            //    //this.errorValue = 'Gemini Nano is not supported or enabled in this browser.';
            //}
            //      if ("LanguageModel" in self) {
            //                if (!aiSession) {
            //                    //set up AI
            //                    try {
            //                        aiAvailability = await LanguageModel.availability();
            //                        if (aiAvailability == "downloadable" || aiAvailability == "available") {
            //                            aiSession = await LanguageModel.create({
            //                                expectedInputs: [{ type: "text", languages: ["en"] }],
            //                                expectedOutputs: [{ type: "text", languages: ["en"] }],
            //                                initialPrompts: [
            //                                    {
            //                                        role: 'system',
            //                                        content: 'You are a helpful local language model.'
            //                                    }
            //                                ],
            //                                monitor(m) {
            //                                    m.addEventListener('downloadprogress', (e) => {
            //                                        console.log(`Checking local model readiness ${e.loaded * 100}%`);
            //                                        if (e.loaded == 0) {
            //                                            toast.show({
            //                                                label: "AI Enabled",
            //                                                message: `Checking local model readiness <div class="small progress">Loading…</div>`,
            //                                                variant: "success",
            //                                                mode: "dismissible"
            //                                            });
            //                                            //toast.innerHTML = `Checking local model readiness <div class="small progress">Loading…</div>`;
            //                                        } else {
            //                                            toast.show({
            //                                                label: "AI Enabled",
            //                                                message: `Checking local model readiness ${e.loaded * 100}% <div class="small progress">Loading…</div>`,
            //                                                variant: "success",
            //                                                mode: "dismissible"
            //                                            });
            //                                            //toast.innerHTML = `Checking local model readiness ${e.loaded * 100}% <div class="small progress">Loading…</div>`;
            //                                        }
            //                                        //toast.show();
            //                                    });
            //                                },
            //                            });
            //                            //console.log(`Gemini Nano language model parameters: ${await LanguageModel.params()}`);              
            //                            toast.show({
            //                                label: "AI Enabled",
            //                                message: "AI Session Created",
            //                                variant: "success",
            //                                mode: "dismissible"
            //                            });
            //                            toast.show({
            //                                label: "AI Enabled",
            //                                message: "Local AI Ready!",
            //                                variant: "success",
            //                                mode: "dismissible"
            //                            });
            //                            //toastMsg("AI Session Created");
            //                            //toastMsg("Local AI Ready!");
            //                            //inputPrompt.focus();
            //
            //                        } else {
            //                            toast.show({
            //                                label: "AI Not Enabled",
            //                                message: "Error attempting to access Local AI.",
            //                                variant: "info",
            //                                mode: "dismissible"
            //                            });
            //                            //toastMsg(`Error attempting to access Local AI.`, "toastError");
            //                        }
            //                    } catch (error) {
            //                        toast.show({
            //                            label: "AI Not Enabled",
            //                            message: "Error attempting to access Local AI. Please try again.",
            //                            variant: "info",
            //                            mode: "dismissible"
            //                        });
            //                        //toastMsg(`Error attempting to access Local AI. Please try again.`, "toastError");
            //                    }
            //                } else {
            //                    toast.show({
            //                        label: "AI Enabled",
            //                        message: "AI Session Already Created",
            //                        variant: "success",
            //                        mode: "dismissible"
            //                    });
            //                    //toastMsg("AI Session Already Created");
            //                }
            // } else {
            // toast.show({
            // label: "AI Not Enabled",
            // message: "Local AI Not Available for this computer.",
            // variant: "info",
            // mode: "dismissible"
            // });
            //toastMsg(`Local AI Not Available for this computer.`, "toastError");
            // }
            //modelStatusEl.innerHTML
            // this.bodyText = `Context used: ${aiSession.contextUsage}/${aiSession.contextWindow}`;
        }
        else {
            this.bodyText = "the button is off"
            toast.show({
                label: "AI Disabled",
                message: this.bodyText,
                mode: "dismissible",
                variant: "info"
            });
        }
    }
    //#endregion

    // #region *** trap for prompt entry ***
    // Description: hendles processing the message
    // Created on: 2026.04.28
    // Modified on: 
    // ***    
    userInput = '';
    handleInput(event) {
        this.userInput = event.target.value;
    }
    // #endregion

    sendMessage() {

        toast.show({
            label: "User Message",
            message: this.userInput,
            mode: "dismissible",
            variant: "info"
        });

        //        try {
        //            const result = await aiSession.promptStreaming(promptText, {
        //                signal: controller.signal
        //            });
        //
        //            // #region *** approach 3 using innerHTML and different markdown streamer ***
        //            // Description: taken from https://chrome.dev/web-ai-demos/ai-streaming-parser/script.js
        //            // which came from here https://chrome.dev/web-ai-demos/ai-streaming-parser/
        //            // and when clicking on AI Streaming Parser here https://developer.chrome.com/docs/ai/render-llm-responses
        //            // everything gets wiped after each run - you'd have to store in local storage and read back in, but even then
        //            // it could become daunting because the innerHTML performance would degrade - really only useful for one and dones
        //            // Created: 2026.04.21
        //            // ***
        //            const renderer = smd.default_renderer(answer);
        //            const parser = smd.parser(renderer);
        //
        //            let chunks = '';
        //            for await (const chunk of result) {
        //                //console.log(chunk);
        //                chunks += chunk;
        //                // had to comment out DOMPurify because you have to whitelist any XML - 
        //                //best practice is to uncomment if you are not working with markup languages
        //                //DOMPurify.sanitize(chunks);
        //                //if (DOMPurify.removed.length) {
        //                //  // Immediately stop what you were doing.
        //                //  smd.parser_end(parser);
        //                //  const { from } = DOMPurify.removed[0];
        //                //  alert(
        //                //    'Insecure model output removed from <' +
        //                //    from.nodeName.toLowerCase() +
        //                //    '>.'
        //                //  );
        //                //  return;
        //                smd.parser_write(parser, chunk);
        //                // Run this every time a new chunk of text is added:
        //                scrollToBottom();
        //            }
        //            toastMsg(`Processing finished!`);
        //            inputPrompt.focus();
        //            smd.parser_end(parser);
        //            // #endregion
        //
        //            modelStatusEl.innerHTML = `Context used: ${aiSession.contextUsage}/${aiSession.contextWindow}`;
        //        } catch (err) {
        //            smd.parser_end(parser);
        //            messagesEl.innerHTML = "Error calling browser AI. Please refresh the browser tab and try again.";
        //        }
    }

    stopLLM() {
        toast.show({
            label: "Cancel LLM",
            message: "User requested cancel",
            mode: "dismissible",
            variant: "info"
        });
    }
}