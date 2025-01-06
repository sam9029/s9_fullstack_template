export const topNavThemeMap = new Map([
  // 深蓝
  [
    'DarkBlue',
    {
      bgColor: '#041b47',
      color: '#949494',
      variables: `:root {
        --kj-nav-background-color: #041b47;
        --kj-nav-active-bottom-color: #2F88FF;
        --kj-nav-color: #a7a7a7;
        --kj-nav-selected-color: #ffffff;
        --kj-nav-title: #ffffff;
        --kj-nav-icon: #eeeded;
        
        --kj-side-all-background-color: #fdfefe;
        --kj-side-selected-background-color: #ecf7fc;
        --kj-side-color: #333333;
        --kj-side-selected-color: #2F88FF;
      }`,
    },
  ],

  // 中蓝
  [
    'InBlue',
    {
      bgColor: '#022465',
      color: '#949494',
      variables: `:root {
        --kj-nav-background-color: #022465;
        --kj-nav-active-bottom-color: #266fff;
        --kj-nav-color: #949494;
        --kj-nav-selected-color: #ffffff;
        --kj-nav-title: #ffffff;
        --kj-nav-icon: #eeeded;
        
        --kj-side-all-background-color: #fdfefe;
        --kj-side-selected-background-color: #ecf7fc;
        --kj-side-color: #333333;
        --kj-side-selected-color: #2F88FF;
      }`,
    },
  ],

  // 浅蓝 渐变
  [
    'LightBlue',
    {
      bgColor: 'LightBlue',
      color: '#949494',
      variables: `:root {
        --kj-nav-background-color: linear-gradient(#097dfd, #1199fd);;
        --kj-nav-active-bottom-color: #ffffff;
        --kj-nav-color: #acdbff;
        --kj-nav-selected-color: #ffffff;
        --kj-nav-title: #ffffff;
        --kj-nav-icon: #eeeded;
        
        --kj-side-all-background-color: #fdfefe;
        --kj-side-selected-background-color: #ecf7fc;
        --kj-side-color: #333333;
        --kj-side-selected-color: #2F88FF;
      }`,
    },
  ],

  // 深红
  [
    'Crimson',
    {
      bgColor: '#900a10',
      color: '#949494',
      variables: `:root {
        --kj-nav-background-color: #900a10;
        --kj-nav-active-bottom-color: #ffffff;
        --kj-nav-color: #dba7a7;
        --kj-nav-selected-color: #ffffff;
        --kj-nav-title: #ffffff;
        --kj-nav-icon: #ffffff;
        
        --kj-side-all-background-color: #fdfefe;
        --kj-side-selected-background-color: #f6f6f6;
        --kj-side-color: #000000;
        --kj-side-selected-color: #f7081c;
      }`,
    },
  ],

  // 渐变红色
  [
    'gradientRed',
    {
      bgColor: 'gradientRed',
      color: '#c27374',
      variables: `:root {
        --kj-nav-background-color: linear-gradient(#ff6862, #b80c05);
        --kj-nav-active-bottom-color: #ffffff;
        --kj-nav-color: #ffb8b7;
        --kj-nav-selected-color: #ffffff;
        --kj-nav-title: #ffffff;
        --kj-nav-icon: #ffffff;

        --kj-side-all-background-color: #fdfefe;
        --kj-side-selected-background-color: #f6f6f6;
        --kj-side-color: #000000;
        --kj-side-selected-color: #f7081c;
      }`,
    },
  ],

  [
    'LightRed',
    {
      bgColor: '#f8534c',
      color: '#c27374',
      variables: `:root {
        --kj-nav-background-color: #f8534c;
        --kj-nav-active-bottom-color: #ffffff;
        --kj-nav-color: #feccca;
        --kj-nav-selected-color: #ffffff;
        --kj-nav-title: #ffffff;
        --kj-nav-icon: #ffffff;

        --kj-side-all-background-color: #fdfefe;
        --kj-side-selected-background-color: #f6f6f6;
        --kj-side-color: #000000;
        --kj-side-selected-color: #f7081c;
      }`,
    },
  ],

  // 白色
  [
    'white',
    {
      bgColor: '#e7e6e5',
      color: '#6d6d6d',
      variables: `:root {
        --kj-nav-background-color: #f9fbfb;
        --kj-nav-active-bottom-color: #e60012;
        --kj-nav-color: #6d6d6d;
        --kj-nav-selected-color: #000000;
        --kj-nav-title: #f6f6f6;
        --kj-nav-icon: #f7081c;

        --kj-side-all-background-color: #ffffff;
        --kj-side-selected-background-color: #f6f6f6;
        --kj-side-color: #333333;
        --kj-side-selected-color: #f7081c;
      }`,
    },
  ],
]);

const id = 'top-nav-style';
export function topStyleChange(color) {
  let styleTag = document.getElementById(id);
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.setAttribute('id', id);
    document.head.appendChild(styleTag);
  }

  if (topNavThemeMap.has(color)) {
    styleTag.innerHTML = topNavThemeMap.get(color).variables;
  }
}
