'use strict';

const { createElement, useState } = React;

let recognition = null;

const start = (setListenState, setSpeech) => {
  console.log('[START]start');

  const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = (event) => {
    console.log(event);
    const resultList = [];
    for (const result of event.results) {
      resultList.push(result);
    }

    const speechList = resultList.filter((result) => {
      return result.isFinal;
    }).map((result) => {
      return result[0].transcript;
    });

    setSpeech(speechList);
  };
  recognition.onend = () => {
    console.log('onend');
    setListenState("ready");
  };
  recognition.onerror = (event) => {
    console.error(event);
    setListenState("ready");
  };

  recognition.start();

  setListenState("listening");

  console.log('[END]start');
};

const stop = (setListenState) => {
  recognition.stop();
  setListenState("ready");
};

const clear = (setListenState, setSpeechList) => {
  setSpeechList([]);
  setListenState("ready");
};

const summary = async (apiKey, input, props) => {
  return await postChatCompletion(apiKey, `${input} 要約して`, props);
};

const postChatCompletion = async (apiKey, input, { model = 'gpt-3.5-turbo' }) => {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: input,
        }
      ]
    })
  })
    .then((response) => response.json())
    .then((body) => {
      return body.choices[0].message.content;
    })
    .catch((error) => {
      console.error(error);
    });
};

const Input = ({
  label,
  value,
  type = "text",
  id = "",
  disabled = false,
  onChange = () => { },
}) => {
  return (
    <div className="uk-margin">
      <label className="uk-form-label" htmlFor={id}>{label}</label>
      <input className="uk-input" type={type} id={id} value={value} onChange={onChange} disabled={disabled} />
    </div>
  );
};

const TextArea = ({
  label,
  value,
  id = "",
  disabled = false,
}) => {
  return (
    <div className="uk-margin">
      <label className="uk-form-label" htmlFor={id}>{label}</label>
      <div className="uk-form-controls">
        <textarea className="uk-textarea" id={id} value={value} disabled={disabled}></textarea>
      </div>
    </div>
  );
};


const Page = () => {
  const [listenState, setListenState] = useState("ready");
  const [speechList, setSpeechList] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [apiKey, setApiKey] = useState("");

  return (
    <div>
      {
        listenState === "ready" ?
          <button onClick={() => { start(setListenState, setSpeechList) }} className="uk-button uk-button-default"><span uk-icon="microphone"></span>聞き取り開始</button>
          :
          <button onClick={() => { stop(setListenState) }} className="uk-button uk-button-default"><span uk-icon="microphone"></span>聞き取り中...</button>
      }
      {
        listenState === "ready" ?
          <button onClick={() => { clear(setListenState, setSpeechList) }} className="uk-button uk-button-default"><span uk-icon="trash"></span>クリア</button>
          :
          <button className="uk-button uk-button-default" disabled><span uk-icon="trash"></span>クリア</button>
      }

      <TextArea label="聞き取り結果" value={speechList.join(" ")} disabled></TextArea>

      {
        apiKey ?
          <button onClick={() => {
            summary(apiKey, speechList.join(" ")).then((summary) => {
              setAiSummary(summary);
            });
          }} className="uk-button uk-button-default"><span uk-icon="microphone"></span>要約する</button>
          :
          <button className="uk-button uk-button-default" disabled><span uk-icon="microphone"></span>要約する</button>
      }
      <Input label="API Key" type="password" value={apiKey} onChange={(event) => { setApiKey(event.target.value) }}></Input>
      <TextArea label="AI要約" value={aiSummary} disabled></TextArea>
    </div>
  );
}

const domContainer = document.querySelector('#root-render');
const root = ReactDOM.createRoot(domContainer);
root.render(createElement(Page));
