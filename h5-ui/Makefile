HUBDOMAIN=registry.cn-beijing.aliyuncs.com/yoboo
DSPDOMAIN=$(HUBDOMAIN)/koc-task-h5-ui
TAG := $(shell /bin/date "+%s")
DSPTESTIMAGE=$(DSPDOMAIN):test
DSPIMAGE=$(DSPDOMAIN):latest

define buildFunction
	npm install --registry=https://registry.npmmirror.com
	npm run $(2)
	npm run upload-cdn
	docker build -t $(1) .
	docker push $(1)
endef

release:
	$(call buildFunction, $(DSPIMAGE), build)

release-test:
	$(call buildFunction, $(DSPTESTIMAGE), build)

