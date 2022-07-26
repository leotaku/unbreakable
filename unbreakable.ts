const durationMonth = 31 * 24 * 60 * 60 * 1000;

type Availability = {
  url: string;
  archived_snapshots: {
    closest?: {
      available: true;
      url: string;
      timestamp: string;
      status: string;
    };
  };
};

function archive(url: string): Promise<Response> {
  return fetch("https://web.archive.org/save/", {
    mode: "no-cors",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `url=${url}`,
  });
}

function available(url: string): Promise<Availability> {
  return fetch(`https://archive.org/wayback/available?url=${url}`, {
    headers: { "Cache-Control": "no-cache" },
  }).then((it) => it.json());
}

function anyAvailable(url: string): Promise<Availability> {
  const url_no_prefix = url.replace(/https?:\/\//i, "");
  return available(url).then((avail) =>
    avail.archived_snapshots.closest ? avail : available(url_no_prefix)
  );
}

function parseTimestamp(datestring: string): Date {
  if (datestring.length != 14) {
    throw Error("malformed date string");
  }

  return new Date(
    parseInt(datestring.slice(0, 4)),
    parseInt(datestring.slice(4, 6)),
    parseInt(datestring.slice(6, 8)),
    parseInt(datestring.slice(8, 10)),
    parseInt(datestring.slice(10, 12)),
    parseInt(datestring.slice(12, 14))
  );
}

const references = Array.from(window.document.querySelectorAll("a"))
  .filter((elem) => elem.href.startsWith("http"))
  .map((elem) =>
    anyAvailable(elem.href)
      .then((avail) => {
        if (avail.archived_snapshots.closest) {
          return {
            avail,
            date: parseTimestamp(
              avail.archived_snapshots.closest.timestamp
            ).getTime(),
          };
        }
        return { avail, date: 0 };
      })
      .then(({ avail, date }) => {
        if (date == 0) {
          elem.style.color = "gray";
          elem.insertAdjacentHTML(
            "afterend",
            `<a href="javascript:undefined" title="No archive of content available" style="text-decoration: none">💀</a>`
          );
        } else if (Date.now() - date > durationMonth) {
          elem.insertAdjacentHTML(
            "afterend",
            `<a href="${avail.archived_snapshots.closest.url}" title="Click here for archive of content" style="text-decoration: none">⏰</a>`
          );
        }
        return { elem, date };
      })
  );

Promise.all(references).then((unsorted) =>
  unsorted
    .sort((a, b) => a.date - b.date)
    .reduce((stack, { elem }) => {
      return stack
        .then(() => archive(elem.href))
        .then(() => console.log("Archived:", elem.href))
        .then(() => new Promise((resolve) => setTimeout(resolve, 15000)));
    }, Promise.resolve())
);
