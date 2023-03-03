import Head from "next/head";
import { useEffect, useState } from "react";
import Markdown from "../components/Markdown";
import styles from "./index.module.css";
import { v4 as uuidv4 } from "uuid";

export default function Home() {
  const [input, setInput] = useState("");
  const [id, setId] = useState(uuidv4());
  const [history, setHistory] = useState([]);
  const [indices, setIndices] = useState([]);
  const [submitDisabled, setSubmitDisabled] = useState(false);

  useEffect(() => {
    const index = localStorage.getItem("my-chatgpt-indices");
    if (index) {
      setIndices(JSON.parse(index));
    }
  }, []);

  async function handleSubmit() {
    setSubmitDisabled(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          animal: input,
          history,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      const newHistory = [
        ...history,
        { role: "user", content: input },
        { role: "assistant", content: data.result },
      ];
      setHistory(newHistory);
      setIndices((prev) => {
        let newIndices;
        if (prev.findIndex((x) => x === id) === -1) {
          newIndices = [...prev, id];
        } else {
          newIndices = prev;
        }
        localStorage.setItem("my-chatgpt-indices", JSON.stringify(newIndices));
        localStorage.setItem(id, JSON.stringify(newHistory));
        return newIndices;
      });
      setInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
    setSubmitDisabled(false);
  }

  async function handleKeyDown(e) {
    if (e.keyCode == 13 && e.shiftKey) {
      await handleSubmit();
      e.preventDefault();
    }
  }

  function onSave() {
    if (history.length === 0) {
      console.info("No history to save");
      return;
    }

    setIndices((prev) => {
      let newIndices;
      if (prev.findIndex((x) => x === id) === -1) {
        newIndices = [...prev, id];
      } else {
        newIndices = prev;
      }
      localStorage.setItem("my-chatgpt-indices", JSON.stringify(newIndices));
      localStorage.setItem(id, JSON.stringify(history));
      return newIndices;
    });
  }

  function onClick() {
    onSave();
    setId(uuidv4());
    setHistory([]);
  }

  function onLoad(item) {
    onSave();
    setHistory((_) => {
      setId(item);
      return JSON.parse(localStorage.getItem(item));
    });
  }

  async function onExport() {
    const historyText = history
      .map(
        (x, index) =>
          (x.role === "assistant" ? "A" : "Q") +
          (Math.floor(index / 2) + 1) +
          ": " +
          x.content
      )
      .join("\n");
    await navigator.clipboard.writeText(historyText);
    alert("导出成功");
  }

  async function onSubmit(event) {
    event.preventDefault();
    await handleSubmit();
  }

  return (
    <div className="flex h-screen flex-col justify-between">
      <Head>
        <title>My ChatGPT</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <img src="/dog.png" className={styles.icon} />
        <h3>My ChatGPT</h3>
        <div className="flex flex-col gap-5 sm:flex-row">
          <ul className="min-w-20 list-none divide-y-2 divide-gray-500 overflow-auto">
            {indices.map((item, index) => (
              <li
                key={item}
                onClick={() => onLoad(item)}
                style={{
                  backgroundColor: item === id ? "#dddddd" : "white",
                }}
              >
                {JSON.parse(localStorage.getItem(item))[0].content.substr(
                  0,
                  20
                ) + "..."}
                {index < indices.length - 1 ? <hr /> : null}
              </li>
            ))}
          </ul>

          <div className="basis-50 shrink-0 grow-0 flex-col gap-5">
            <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
              <textarea
                name="input"
                placeholder="在这里输入（Shift+回车快速提交）"
                value={input}
                className="basis-2/3"
                style={{ height: "80px" }}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e)}
              />
              <div className="margin-2 flex basis-1/3 items-center justify-center gap-2">
                <button
                  onClick={onSubmit}
                  title="将当前输入的内容发送给ChatGPT"
                  disabled={submitDisabled}
                  style={{
                    backgroundColor: submitDisabled ? "grey" : "#10a37f",
                  }}
                >
                  发送
                </button>
                <button
                  onClick={onExport}
                  title="将当前对话的完整内容复制到剪贴板"
                  style={{ backgroundColor: "#2388e2" }}
                >
                  导出
                </button>
                <button
                  onClick={onClick}
                  title="开始一个新对话（当前对话将被自动保存）"
                  style={{ backgroundColor: "#a0037f" }}
                >
                  新建
                </button>
              </div>
            </div>
            <div className="flex max-w-3xl items-center justify-center gap-2">
              <ul className="list-none divide-y-2 divide-gray-500 overflow-auto">
                {Array.from({ length: history.length / 2 }).map((_, index) => (
                  <li key={history.length - 2 * index - 2}>
                    <Markdown
                      children={
                        "❓\n" + history[history.length - 2 * index - 2].content
                      }
                    />
                    <Markdown
                      children={
                        "🤖\n" + history[history.length - 2 * index - 1].content
                      }
                    />
                    <br />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <footer className="flex items-center justify-center rounded-lg bg-white p-4 shadow dark:bg-gray-800">
        <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-center">
          © 2023{" "}
          <a href="https://github.com/lucifer1004" className="hover:underline">
            Gabriel Wu
          </a>
          . All Rights Reserved.
        </span>
      </footer>
    </div>
  );
}
