const useCarousel = () => {
  // カルーセルのクラス名を定義
  const carouselClassName = '.js-carousel';
  // カルーセルインスタンスを管理するMapオブジェクト
  const carouselInstances = new Map();

  /**
   * カルーセルインスタンスを作成する関数
   * @param {HTMLElement} element - カルーセルのDOM要素
   * @returns {Object} カルーセルインスタンスオブジェクト
   */
  const createCarouselInstance = (element) => {
    // スクリーンリーダー用のライブリージョンを作成
    const liveRegion = document.createElement('div');

    // 各種ボタンとコンテナ要素を取得
    const autoplayButton = element.querySelector(
      '.js-carousel-autoplay-button'
    );
    const paginationContainer = element.querySelector(
      '.js-carousel-pagination'
    );
    const previousButton = element.querySelector('.js-carousel-previous');
    const nextButton = element.querySelector('.js-carousel-next');

    // Swiperインスタンスを作成・設定
    const swiper = new Swiper(element, {
      direction: 'horizontal', // 水平方向のスライド
      slidesPerView: 'auto', // スライドの表示数を自動調整
      spaceBetween: 8, // スライド間の余白（デフォルト）
      loop: true, // 無限ループを有効化

      // ナビゲーションボタンの設定
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },

      // 自動再生の設定
      autoplay: {
        delay: 3e3, // 3秒間隔で自動再生
        disableOnInteraction: false, // ユーザー操作後も自動再生を継続
      },

      // ページネーションの設定
      pagination: {
        el: paginationContainer,
        bulletElement: 'button', // ページネーションをボタン要素で作成
        clickable: true, // クリック可能にする
      },

      // アクセシビリティ設定
      a11y: {
        prevSlideMessage: '前のスライドへ',
        nextSlideMessage: '次のスライドへ',
        slideLabelMessage: '{{index}}枚目',
        paginationBulletMessage: '{{index}}枚目のスライドを表示',
      },
    });

    return {
      swiper,
      liveRegion,
      autoplayButton,
      paginationContainer,
      previousButton,
      nextButton,
    };
  };

  /**
   * カルーセルを初期化する関数
   * ページ内の全てのカルーセル要素を検索し、それぞれにインスタンスを作成
   */
  const initCarousel = () => {
    const carouselElements = document.querySelectorAll(carouselClassName);

    carouselElements.forEach((element, index) => {
      // カルーセルのIDを取得（なければ自動生成）
      const carouselId = element.id || `carousel-${index}`;

      // カルーセルインスタンスを作成
      const instance = createCarouselInstance(element);

      // インスタンスをMapに保存（後で参照できるように）
      carouselInstances.set(carouselId, instance);

      // 各種機能を初期化
      initAutoplayButton(instance); // 自動再生ボタンの初期化
      initLiveRegion(instance, element); // ライブリージョンの初期化
      initAnnouncePagination(instance); // ページネーション音声案内の初期化
      removeCarouselAttributes(element); // 不要な属性の削除
      initAnnouncePreviousButton(instance); // 前へボタンの音声案内初期化
      initAnnounceNextButton(instance); // 次へボタンの音声案内初期化
    });
  };

  /**
   * カルーセル要素から不要な属性を削除する関数
   * @param {HTMLElement} element - カルーセル要素
   */
  const removeCarouselAttributes = (element) => {
    const wrapper = element.querySelector('.js-carousel-wrapper');
    if (wrapper === null) return;

    // Swiperが独自のaria-liveを管理するため、既存のものを削除
    wrapper.removeAttribute('aria-live');
  };

  /**
   * 自動再生の開始/停止を切り替える関数
   * @param {HTMLElement} button - 自動再生ボタン要素
   * @param {Object} instance - カルーセルインスタンス
   */
  const toggleAutoplay = (button, instance) => {
    if (instance.swiper.autoplay.running) {
      // 自動再生中の場合は停止
      instance.swiper.autoplay.stop();
      button.setAttribute('data-status', 'stop');
      button.textContent = '再生';
    } else {
      // 停止中の場合は開始
      instance.swiper.autoplay.start();
      button.setAttribute('data-status', 'start');
      button.textContent = '停止';
    }
  };

  /**
   * ライブリージョンを初期化する関数
   * スクリーンリーダー用の音声案内領域を設定
   * @param {Object} instance - カルーセルインスタンス
   * @param {HTMLElement} slideElement - スライド要素
   */
  const initLiveRegion = (instance, slideElement) => {
    instance.liveRegion.className = 'c-carousel__live-region';
    instance.liveRegion.setAttribute('aria-live', 'polite'); // 丁寧な音声案内
    instance.liveRegion.setAttribute('aria-atomic', 'true'); // 内容全体を読み上げ

    // スライド要素の直後にライブリージョンを挿入
    slideElement.insertAdjacentElement('afterend', instance.liveRegion);
  };

  /**
   * ライブリージョンにメッセージを表示し、一定時間後にクリアする関数
   * @param {string} message - 案内メッセージ
   * @param {HTMLElement} liveRegion - ライブリージョン要素
   */
  const announceMessage = (message, liveRegion) => {
    liveRegion.textContent = message;

    // 1秒後にメッセージをクリア（連続した案内を防ぐため）
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1e3);
  };

  /**
   * ページネーションボタンクリック時の音声案内を初期化する関数
   * @param {Object} instance - カルーセルインスタンス
   */
  const initAnnouncePagination = (instance) => {
    const paginationContainer = instance.paginationContainer;
    if (paginationContainer) {
      paginationContainer.addEventListener('click', (event) => {
        const button = event.target;

        // クリックされた要素がボタンの場合のみ処理
        if (button.tagName === 'BUTTON') {
          // ボタンのインデックスを取得
          const buttons = Array.from(
            paginationContainer.querySelectorAll('button')
          );
          const index = buttons.indexOf(button);

          // スライド番号を音声案内
          announceMessage(
            `${index + 1}枚目のスライドを表示`,
            instance.liveRegion
          );
        }
      });
    }
  };

  /**
   * 自動再生ボタンの動作を初期化する関数
   * @param {Object} instance - カルーセルインスタンス
   */
  const initAutoplayButton = (instance) => {
    const button = instance.autoplayButton;
    if (button === null) return;

    button.addEventListener('click', (event) => {
      const button2 = event.target;

      // 自動再生の状態を切り替え
      toggleAutoplay(button2, instance);

      // 切り替え後の状態に応じて音声案内
      if (instance.swiper.autoplay.running) {
        announceMessage('自動再生を停止しました', instance.liveRegion);
      } else {
        announceMessage('自動再生を開始しました', instance.liveRegion);
      }
    });
  };

  /**
   * 前へボタンクリック時の音声案内を初期化する関数
   * @param {Object} instance - カルーセルインスタンス
   */
  const initAnnouncePreviousButton = (instance) => {
    const previousButton = instance.previousButton;
    if (previousButton === null) return;

    previousButton.addEventListener('click', () => {
      announceMessage('前のスライドへ', instance.liveRegion);
    });
  };

  /**
   * 次へボタンクリック時の音声案内を初期化する関数
   * @param {Object} instance - カルーセルインスタンス
   */
  const initAnnounceNextButton = (instance) => {
    const nextButton = instance.nextButton;
    if (nextButton === null) return;

    nextButton.addEventListener('click', () => {
      announceMessage('次のスライドへ', instance.liveRegion);
    });
  };

  return {
    initCarousel,
  };
};
