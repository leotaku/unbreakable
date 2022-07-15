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
    body: new URLSearchParams({
      url: url,
    }),
  });
}

function access(url: string): Promise<Availability> {
  return fetch(
    "https://archive.org/wayback/available?" +
      new URLSearchParams({
        url: url.replace(/https?:\/\//i, ""),
      }),
    {
      headers: { "Cache-Control": "no-cache" },
    }
  ).then((it) => it.json());
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

const durationMonth = 31 * 24 * 60 * 60 * 1000;
var urls: Promise<{ elem: HTMLAnchorElement; avail: Availability }>[] = [];

window.document.querySelectorAll("a").forEach((elem) =>
  urls.push(
    access(elem.href)
      .then((avail) => {
        if (avail.archived_snapshots.closest) {
          let now = Date.now();
          let archivedAt = parseTimestamp(
            avail.archived_snapshots.closest.timestamp
          );
          if (now - archivedAt.getTime() > durationMonth) {
            elem.insertAdjacentHTML(
              "afterend",
              `<a href="${avail.archived_snapshots.closest.url}" title="Click here for archive of content" style="text-decoration: none">⏰</a>`
            );
          }
        } else {
          elem.style.color = "darkgray";
          elem.insertAdjacentHTML(
            "afterend",
            `<a href="#" title="No archive of content available" style="text-decoration: none">💀</a>`
          );
        }

        return { elem, avail };
      })
      .catch(() => null)
  )
);

Promise.all(urls).then((unsorted) =>
  unsorted
    .map((value) => {
      var sort = new Date(0);
      if (value.avail.archived_snapshots.closest) {
        sort = parseTimestamp(value.avail.archived_snapshots.closest.timestamp);
      }
      return { value, sort };
    })
    .sort((a, b) => a.sort.getDate() - b.sort.getDate())
    .map(({ value }) => value)
    .reduce((stack, { elem }) => {
      return stack
        .then(() => archive(elem.href))
        .then(() => console.log("Archived:", elem.href))
        .then(() => new Promise((resolve) => setTimeout(resolve, 11000)))
        .catch(() => {});
    }, Promise.resolve())
);

// Array.from(window.document.querySelectorAll("a"))
//   .map((value) => ({ value, sort: Math.random() }))
//   .sort((a, b) => a.sort - b.sort)
//   .map(({ value }) => value)
//   .reduce((stack, elem) => {
//     return stack
//       .then(() => archive(elem.href))
//       .then(() => console.log("Archived:", elem.href))
//       .then(() => new Promise((resolve) => setTimeout(resolve, 11000)))
//       .catch(() => {});
//   }, Promise.resolve());
