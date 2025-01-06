HUBDOMAIN=registry.cn-beijing.aliyuncs.com/yoboo
DSPDOMAIN=$(HUBDOMAIN)/joyful-creation-h5-ui
TAG := $(shell /bin/date "+%s")
DSPTESTIMAGE=$(DSPDOMAIN):test
DSPIMAGE=$(DSPDOMAIN):latest

define buildFunction
	cli publish --platform h5 --project joyful-creation-uni-ui --webDomain joyful.tuixiaoguo.com
	npm run upload-cdn
	docker build -t $(1) .
	docker push $(1)
endef

release:
	$(call buildFunction, $(DSPIMAGE), build:prod)

release-test:
	$(call buildFunction, $(DSPTESTIMAGE), build:stage)

