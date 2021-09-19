const EMPTY_SYMBOL = ' ';
MILITARY_DEP = 'спец подготовка';
const LESSON_TYPES = ['empty', 'ЛЕК', 'ЛАБ', 'ПР'];
const TYPES_CLASSES = ['emptyLesson', 'Lect', 'Lab', 'Pract'];
const DAYS_OF_WEEKS = [
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
  'Воскресенье',
];

const emptyDay = {
  type: 0,
  name: '',
  cab: '',
  prepod: '',
  hours: '',
  today: false,
};

function parseAndHideOldTable() {
  const table = document.querySelector('.korpus tbody');

  const rows = [...table.querySelectorAll('tr')];
  rows.splice(0, 2);

  const cells = [];

  let nowDay = null;
  for (const row of rows) {
    row.querySelector('th > span[style*="font-weight: bold; color:red;"]')
      ? (nowDay = rows.indexOf(row))
      : null;
    const els = [...row.querySelectorAll('td')];
    cells.push(els);
  }

  const schedule = [];
  for (const day of cells) {
    const lessons = [];
    for (const les of day) {
      const elText = les.innerText;

      if (elText !== EMPTY_SYMBOL && !elText.includes(MILITARY_DEP)) {
        const lesString = elText.split('●');

        const firstInfo = lesString[0].split(' ');
        const type = LESSON_TYPES.indexOf(firstInfo[1]);
        const cab = firstInfo[2];

        const hoursRegEx = /\d+  час.(\s)?/;
        const secondInfo = lesString[1].split('\n');
        const prepod = secondInfo[1].split(' ', 3).join(' ');
        const name = secondInfo[0].split(hoursRegEx).join('');
        const hours = secondInfo[0].match(hoursRegEx)[0].match(/\d+/)[0];
        const today = les.attributes['*title']?.value === 'Выполняется';

        lessons.push({
          type,
          name,
          cab,
          prepod,
          hours,
          today,
        });
      } else {
        lessons.push(emptyDay);
      }
    }

    schedule.push(lessons);
  }

  table.style.display = 'none';
  return {
    schedule,
    container: {
      container: table.parentElement.parentElement,
      childWidth:
        table.parentElement.clientWidth -
        (document.body.clientWidth - document.body.offsetWidth),
    },
    nowDay,
  };
}

function createTables(parsed) {
  const { schedule, nowDay } = parsed;

  const firstWeekTable = document.createElement('table');
  const secondWeekTable = document.createElement('table');

  const getTextForCell = (les) => {
    if (les.type === 0) return '';

    const paragraph = document.createElement('p');
    paragraph.innerText = les.name;

    const description = document.createElement('span');
    description.innerText = `${les.prepod} | ${les.cab}`;
    description.style.display = 'block';
    paragraph.append(description);
    return paragraph;
  };

  let firstWeek = new Array(schedule[0].length).fill(0);
  firstWeek = firstWeek.map((el) => (el = document.createElement('tr')));

  let secondWeek = new Array(schedule[1].length).fill(0);
  secondWeek = secondWeek.map((el) => (el = document.createElement('tr')));

  const daysOfWeeks1 = document.createElement('thead');
  daysOfWeeks1.append(document.createElement('th'));

  const daysOfWeeks2 = document.createElement('thead');
  daysOfWeeks2.append(document.createElement('th'));

  schedule.forEach((day, numb) => {
    const dayOfWeek = document.createElement('th');
    dayOfWeek.innerHTML = DAYS_OF_WEEKS[Math.floor(numb / 2)];
    dayOfWeek.classList.add(
      'day-of-week',
      isFinite(nowDay) && nowDay + 1 === numb ? 'today' : undefined
    );
    (numb % 2 === 0 ? daysOfWeeks1 : daysOfWeeks2).append(dayOfWeek);

    day.forEach((les, i) => {
      if (numb === 0 || numb === 1) {
        const dayNumb = document.createElement('td');
        dayNumb.innerHTML = i + 1;
        dayNumb.classList.add('les-numb');
        dayNumb.addEventListener('click', (el) => {
          el.target.parentElement.classList.toggle('uncollapsed');
        });
        (numb % 2 === 0 ? firstWeek : secondWeek)[i].append(dayNumb);
      }
      const newCell = document.createElement('td');
      newCell.append(getTextForCell(les));
      newCell.classList.add(
        TYPES_CLASSES[les.type],
        les.today ? 'today' : undefined
      );
      const location = (numb % 2 === 0 ? firstWeek : secondWeek)[i];
      if (les.type === 0)
        location.dataset.skipped = parseInt(location.dataset.skipped || 0) + 1;
      location.append(newCell);
      location.classList.toggle(
        'uncollapsed',
        parseInt(location.dataset.skipped) === location.children.length - 1
      );
    });
  });

  firstWeekTable.classList.add('newScheduleTable');
  secondWeekTable.classList.add('newScheduleTable');

  firstWeekTable.append(daysOfWeeks1, ...firstWeek);
  secondWeekTable.append(daysOfWeeks2, ...secondWeek);
  return [firstWeekTable, secondWeekTable];
}

/**
 * @param {*} tables
 * @param {HTMLDivElement} container
 */
function locateTables(tables, containerObj) {
  const { container, childWidth } = containerObj;
  const wrapper = document.createElement('div');
  wrapper.classList.add('tables-wrapper');

  const modifyTable = (tbl, i) => {
    const tablesInfo = [
      {
        label: 'Первая',
        btnLocation: 'append',
        translateX: `-${childWidth}px`,
        direction: 'to-right',
      },
      {
        label: 'Вторая',
        btnLocation: 'prepend',
        translateX: '0',
        direction: 'to-left',
      },
    ];
    const tableInfo = tablesInfo[i];
    const tblContainer = document.createElement('div');
    tblContainer.classList.add('table-container');

    const h = document.createElement('h2');
    h.innerText = `${tableInfo.label} неделя`;

    const switchBtn = document.createElement('button');
    switchBtn.classList.add('switch-table', 'btn-' + tableInfo.direction);
    switchBtn.addEventListener(
      'click',
      () => (wrapper.style.transform = `translateX(${tableInfo.translateX})`)
    );

    h[tableInfo.btnLocation](switchBtn);
    tblContainer.append(h, tbl);
    tblContainer.style.width = childWidth;
    return tblContainer;
  };

  container.style.overflow = 'hidden';
  wrapper.style.width = childWidth * 2;
  tables.forEach((tbl, i) => {
    wrapper.append(modifyTable(tbl, i));
  });
  container.prepend(wrapper);
}

function addStylesAndFont() {
  const style = document.createElement('style');
  style.innerHTML = `
    .table-container h2 {
      margin: 20px auto;
      font-family: Comfortaa;
      font-weight: 700;
      position: relative;
      width: fit-content;
    }
    .newScheduleTable{
      margin: 0 auto;
    }
    .newScheduleTable * {
      font-family: Comfortaa;
      border-radius: 5px;
      text-align: center;
    }
    .newScheduleTable tr {
      height: 100px;
    }
    .newScheduleTable tr.uncollapsed {
      height: 40px;
    }
    .newScheduleTable tr.uncollapsed p {
      height: 0;
      overflow: hidden;
    }
    .newScheduleTable tr.uncollapsed td:first-child::after {
      content: '';
      position: absolute;
      width: 6px;
      height: 6px;
      bottom: 5px;
      left: calc(50% - 3px);
      border-bottom: #000 1px solid;
      border-right: #000 1px solid;
      transform: rotate(45deg);
    }
    .newScheduleTable tr.uncollapsed td:not(:first-child)::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 1;
      background: #ccc;
      border-radius: 5px;
    }
    .newScheduleTable td {
      width: 300px;
      position: relative;
    }
    .${TYPES_CLASSES[0]} {
      background: #d0e0e3;
    }
    .${TYPES_CLASSES[1]} {
      background: #b6d7a8;
    }
    .${TYPES_CLASSES[2]} {
      background: #dd98e7;
    }
    .${TYPES_CLASSES[3]} {
      background: #a4c2f4;
    }
    .newScheduleTable p {
      margin: 0;
      font-weight: 700;
      font-size: .8em;
    }
    .newScheduleTable p span {
      font-weight: 300;
      margin-top: 10px;
      font-size: .75em;
      color: #980000;
    }
    .newScheduleTable th.day-of-week {
      background: #999;
      height: 50px;
    }
    .newScheduleTable td.les-numb {
      background: #999;
      width: 40px;
      cursor: pointer;
    }
    .tables-wrapper {
      display: flex;
      justify-content: space-around;
      transition: transform 1s;
    }
    .switch-table {
      display: inline-block;
      background: #fff;
      border: #000 1px solid;
      border-radius: 15px;
      width: 30px;
      height: 30px;
      position: absolute;
      cursor: pointer;
    }
    .switch-table::after {
      content: '';
      width: 9px;
      height: 9px;
      position: absolute;
    }
    .btn-to-left {
      left: -40px;
    }
    .btn-to-left::after {
      border-bottom: #000 1px solid;
      border-left: #000 1px solid;
      transform: translate(-30%, -50%) rotate(45deg);

    }
    .btn-to-right {
      right: -40px;
    }
    .btn-to-right::after {
      border-top: #000 1px solid;
      border-right: #000 1px solid;
      transform: translate(-70%, -50%) rotate(45deg);
    }
    .today {
      border: red 1px solid;
    }
  `;
  const font = document.createElement('link');
  font.rel = 'stylesheet';
  font.type = 'text/css';
  font.href =
    'https://fonts.googleapis.com/css2?family=Comfortaa:wght@300;400;500;600;700&display=swap';
  document.head.append(font, style);
}

const data = parseAndHideOldTable();
const tables = createTables(data);
locateTables(tables, data.container);
addStylesAndFont();
